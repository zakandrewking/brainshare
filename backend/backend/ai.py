import asyncio
import re
from collections import deque
from dataclasses import dataclass
from itertools import chain, islice
from typing import Iterable, Iterator, TypeVar

from glom import glom
import openai
import tiktoken
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from backend.config import EMBEDDING_CTX_LENGTH, EMBEDDING_ENCODING, EMBEDDING_MODEL
from backend.models import Chemical, Species
from backend.schemas import ResourceMatch
from backend.util import batched

# from
# https://github.com/openai/openai-cookbook/blob/main/examples/Embedding_long_inputs.ipynb


async def get_embedding(text_or_tokens, model) -> list[float]:
    result = await openai.Embedding.acreate(input=text_or_tokens, model=model)
    return result["data"][0]["embedding"]


def chunk_tokens(text, encoding_name, chunk_length: int, overlap: int):
    encoding = tiktoken.get_encoding(encoding_name)
    tokens = encoding.encode(text)
    chunks_iterator = batched(tokens, chunk_length, overlap)
    yield from chunks_iterator


def decode(tokens, encoding_name):
    encoding = tiktoken.get_encoding(encoding_name)
    return encoding.decode(tokens)


def chunk_text(text, encoding_name, chunk_length, overlap: int = 0):
    """

    `overlap` is the number of tokens that will be included in two
    neighboring chunks, to avoid splitting important data like DOIs

    """
    chunker = chunk_tokens(text, encoding_name, chunk_length, overlap)
    yield from (decode(x, encoding_name) for x in chunker)


@dataclass
class ChunkDetail:
    text: str
    embedding: list[float]


async def len_safe_get_embedding(
    text,
    model=EMBEDDING_MODEL,
    max_tokens=EMBEDDING_CTX_LENGTH,
    encoding_name=EMBEDDING_ENCODING,
) -> list[ChunkDetail]:
    async def _get(chunk, model, encoding_name):
        return ChunkDetail(decode(chunk, encoding_name), await get_embedding(chunk, model))

    chunked = chunk_tokens(text, encoding_name=encoding_name, chunk_length=300, overlap=0)
    chunk_details: list[ChunkDetail] = await asyncio.gather(
        *[_get(c, model, encoding_name) for c in chunked]
    )
    return chunk_details


async def embed(text: str) -> list[ChunkDetail]:
    return await len_safe_get_embedding(text)


async def _chat(content: str, model="gpt-3.5-turbo") -> tuple[str, int]:
    res = await openai.ChatCompletion.acreate(
        model=model,
        messages=[{"role": "user", "content": content}],
    )
    content = res.choices[0].message.content
    tokens = res.usage.total_tokens
    return content, tokens


# text = f"""The following text was extracted from a PDF document:

# List the engineered strains that are mentioned in the article. If you
# find an engineered strain, provide the name of each strain on a new line with
# a description, like (Strain Name: Description). If you do not find a
# strain, say "No strains found".
# """


async def _find_chemicals(text: str, session: AsyncSession) -> tuple[list[ResourceMatch], int]:
    template = f"""
Provide the chemical components that are being studied in the text extract.
Provide each chemical name on a new line. If multiple names for an chemical are
available, then provide them on separate lines. If you do not find a chemical,
say "No chemicals found".

Input:

{text}

Output:"""
    res, tokens = await _chat(template)
    names_raw = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip().lower() for x in res.split("\n")]
    names = [x for x in names_raw if "no chemicals found" not in x]
    cs = (
        await session.execute(select(Chemical).where(func.lower(col(Chemical.name)).in_(names)))
    ).all()

    def _build_url(id: int):
        return f"/chemical/{id}"

    rms = [
        ResourceMatch(type="chemical", name=x[0].name, summary="", url=_build_url(x[0].id))
        for x in cs
    ]

    no_match = set(names) - set(rm.name.lower() for rm in rms)
    print(f"Did not match chemicals {no_match}")

    return rms, tokens


async def _find_species(text: str, session: AsyncSession) -> tuple[list[ResourceMatch], int]:
    # ask for matches
    template = f"""
Provide the scientific name for the organisms that are being studied in the text
extract. Provide each organism on a new line. Also provide a summary of the how
the organism is related to this article. If you do not find an organism, say "No
organisms found".

Input:

Here, we construct an ME-Model for   Escherichia coli —a genome-scale model that
seamlessly integrates metabolic and gene product expression pathways. The model
computes  B 80% of the functional proteome (by mass), which is used by the cell

Output:

- Escherichia coli: A computational model of metabolism and gene expression was
  constructed for this model organism.

Input:

and interpret a variety of emerging data types, including linking mutations
identified from human variation data or cancer genome atlases. ( b ) A
comparison of the genes, reactions, metabolites, blocked reactions, and dead-end
metabolites among Recon predecessors   3–5   and HMR2.0 (ref. 6). ( c )
Relationships between genes, the proteins they encode, and the reactions the

Output:

- Homo sapiens: The study describes data related to genome mutations and cancer
  in humans

Input:

Cui et al., “In vivo studies of polypyrrole peptide coated neural 6.753.454 B1
6, 2004

Output

- No organisms found

Input:

{text}

Output:"""
    res, tokens = await _chat(template)
    # parse the matches
    # split lines and strip list attributes
    scientific_raw = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]

    # find scientific name and summary
    def _split(s: str) -> list[str] | None:
        r = s.split(":", 1)
        return [x.strip() for x in r] if len(r) == 2 else None

    matches = {
        n: ResourceMatch(type="species", name=n, summary=s)
        for n, s in (x for x in (_split(x) for x in scientific_raw) if x is not None)
    }
    species_s: list[Species] = [
        x[0]
        for x in (
            await session.execute(
                select(Species).where(
                    func.lower(col(Species.name)).in_(x.name.lower() for x in matches.values())
                )
            )
        ).all()
    ]
    for species in species_s:
        try:
            m = matches[species.name.lower()]
        except KeyError:
            print(f"ERROR - could not find {species.name.lower()}")
            continue
        m.url = f"/species/{species.id}"
        m.name = str(species.name)

    no_match = [x.name for x in species_s if x.url is None]
    if len(no_match) > 0:
        print(f"Did not match species {no_match}")

    return list(matches.values()), tokens


async def _categorize_one(text: str, session: AsyncSession) -> tuple[list[ResourceMatch], int]:
    options = ["chemical", "chemical reaction", "protein", "genome", "organism"]
    content = f"""
Determine which of the following categories has a matching entity in the text.
Include each matching category on a new line. Only return the category names. Be
complete and include even indirectly mentioned members of the categories. If no
categories are found, say 'None found'.

Categories: chemical, chemical reaction, protein, genome, organism

Text:

{text}

Output:"""

    res, tokens = await _chat(content)
    categories = [x for x in options if re.search(rf"\b{x}\b", res)]
    print(f"Categories: {categories}")
    matches: list[ResourceMatch] = []
    if "organism" in categories:
        m, t = await _find_species(text, session)
        matches += m
        tokens += t
    if "chemical" in categories:
        m, t = await _find_chemicals(text, session)
        matches += m
        tokens += t
    return matches, tokens


async def categorize(
    text: str, session: AsyncSession, max_requests: int = 20
) -> tuple[list[ResourceMatch], int]:
    """Split the text and find matches in the database"""
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3700, overlap=20)
    data_list: list[tuple[list[ResourceMatch], int]] = await asyncio.gather(
        *islice((_categorize_one(c, session) for c in chunked), max_requests)
    )
    # flatten and find unique entries
    chunk_matches = list(chain.from_iterable(x[0] for x in data_list))
    tokens = sum(x[1] for x in data_list)

    print(f"Matches ({tokens}): {chunk_matches}")
    return chunk_matches, tokens


async def _tag_one(text: str) -> tuple[list[str], int]:
    content = f"""Provide a short list of useful search tags for the document.
List one tag on each line. Provide 5 to 10 tags in total.

Text: The mission's target asteroid was Dimorphos, the secondary member of the
S-type binary near-Earth asteroid (65803) Didymos.
Tags:
- asteroid Dimorphos
- S-type binary near-Earth asteroid

Text: {text}

Tags:"""
    res, tokens = await _chat(content)
    tags = [
        re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip()
        for x in res.split("\n")
        if "no tags found" not in x.lower()
    ]
    return tags, tokens


async def tag(text: str, max_requests: int = 1) -> tuple[list[str], int]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    # the chunk length here is about right
    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3800, overlap=0)
    data_list: list[tuple[list[str], int]] = await asyncio.gather(
        *islice((_tag_one(c) for c in chunked), max_requests)
    )
    chunk_tags = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    print(f"Tags ({tokens}): {chunk_tags}")
    return chunk_tags, tokens


async def _dois_one(text: str) -> tuple[list[str], int]:
    content = f"""
The goal is to identify DOI entries in text extracted from a PDF. Only provide a
DOI if the DOI string itself is found in the text. Return each DOI on a new
line. Do not invent DOIs. If a DOI is not found, return "DOI not found".

Input:

Citation:   Ranganathan S, Suthers PF, Maranas CD (2010) OptForce: An
Optimization Procedure for Identifying All Genetic Manipulations Leading to
Targeted Overproductions. PLoS Comput Biol 6(4): e1000744.
https://doi.org/10.1371 /journal.pcbi.1000744  Editor:   Nathan D. Price

Output:

- doi:10.1371/journal.pcbi.1000744

Input:

R E V I E W S  132   | FEBRUARY 2006   |   VOLUME 7
www.nature.com/reviews/genetics©   2006   Nature Publishing Group  Databases do
not generally contain all the differ- ent types of information that have been
discussed above. Consequently, various sources must be used to comprehensively
capture the relationship between dif- ferent components   (BOX 2) .

Output:

- DOI not found

Input:

Cui et al., “In vivo studies of polypyrrole peptide coated neural 6.753.454 B1
6, 2004

Output

- DOI not found

Input:

{text}

Output:"""
    res, tokens = await _chat(content)

    def _split_result(r: str) -> list[str]:
        return [
            re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip()
            for x in r.split("\n")
            if len(x.strip()) > 0
            and "doi not found" not in re.sub(r"\s", " ", re.sub(r"[^a-z ]", "", x.lower()))
        ]

    final_dois = _split_result(res)

    return final_dois, tokens


async def dois(text: str, max_requests: int = 1) -> tuple[list[str], int]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3600, overlap=20)
    data_list: list[tuple[list[str], int]] = await asyncio.gather(
        *islice((_dois_one(c) for c in chunked), max_requests)
    )
    chunk_dois = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    print(f"DOIs ({tokens}): {chunk_dois}")
    return chunk_dois, tokens
