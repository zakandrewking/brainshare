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
Provide the names of the chemicals compoounds that are being studied in the
text. Provide each chemical name on a new line. After the chemical name, provide
a colon ":", and then provide a summary of the how the chemical is being studied
in this article. Only provide chemicals. Do not list other entities that are
related to chemicals. Do not provide proteins or macromolecules. If you do not
find a chemical, say "No chemicals found".

Input:

interesting   that,   upon   addition   of   exogenous cyclic   AMP to   the
growth   media,   the   synthesis   of   glutamate   dehydro- genase increases
while   the   synthesis   of   glutamate   synthase decreases (12).   These
observations   suggest   regulatory   differences, the function   of   which
remain   unresolved   at   present.   Further   studies on   the
inter-relationship   between   the   dehydrogcnase   and   synthase enzymes   in
g.   coli   will   be   pursued   with   the   strains

Output:

- glutamate: The study investigated two enzymes that utilize glutamate --
  glutamate dehydrogenase and glutamate synthase -- in the growth of E. coli
- cyclic AMP: This chemical was added to the growth media in the study

Input:

flow metabolism are generally lacking. In this study, we provide a quantitative,
physiological study of over- flow metabolism for the bacterium E. coli. We
report an intriguing set of linear relations between the rates of acetate
excretion and steady- state growth rates for E. coli in different nutrient
environments and different degrees of induced stresses. These relations,
together with the recently established concept of proteome partition21, led us
to a simple theory of resource allocation, which can quantitatively account for
all of the observed behaviours, as well as accurat

Output:

- No chemicals found

Input:

{text}

Output:
"""
    res, tokens = await _chat(template)
    names_raw = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]

    # find chemical name and summary
    def _split(s: str) -> list[str] | None:
        r = s.split(":", 1)
        return [x.strip() for x in r] if len(r) == 2 else None

    matches = {
        n.lower(): ResourceMatch(type="chemical", name=n, summary=s)
        for n, s in (x for x in (_split(x) for x in names_raw) if x is not None)
    }
    chemicals: list[Chemical] = [
        x[0]
        for x in (
            await session.execute(
                select(Chemical).where(
                    func.lower(col(Chemical.name)).in_(x.name.lower() for x in matches.values())
                )
            )
        ).all()
    ]

    for chemical in chemicals:
        try:
            match = matches[chemical.name.lower()]
        except KeyError:
            print(f"ERROR - could not find chemical {chemical.name.lower()}")
            continue
        match.url = f"/chemical/{chemical.id}"
        match.name = str(chemical.name)

    no_match = [x.name for x in matches.values() if x.url is None]
    if len(no_match) > 0:
        print(f"Did not match chemicals {no_match}")

    return list(matches.values()), tokens


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
        n.lower(): ResourceMatch(type="species", name=n, summary=s)
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
            match = matches[species.name.lower()]
        except KeyError:
            print(f"ERROR - could not find {species.name.lower()}")
            continue
        match.url = f"/species/{species.id}"
        match.name = str(species.name)

    no_match = [x.name for x in matches.values() if x.url is None]
    if len(no_match) > 0:
        print(f"Did not match species {no_match}")

    return list(matches.values()), tokens


async def _categorize_one(text: str, session: AsyncSession) -> tuple[list[ResourceMatch], int]:
    # these options are geared toward the LLM knowledgebase. We'll translate
    # them into brainshare resource types below
    options = [
        "chemical",
        "biochemical reaction",
        "biochemical pathway",
        "enzyme",
        "genome",
        "gene",
        "organism",
    ]
    content = f"""
Identify and summarize the entities being studied in this scientific article.
List each entity on a new line. Provide the full scientific name of the entity,
followed by the entity type in parentheses, followed by a summary of the how the
entity is being studied in this article. Each entity type must exist in the
entity types list. If you do not find any entities that match the list of entity
types, say "No entities found".

Entity types:

{", ".join(options)}

Input:

interesting   that,   upon   addition   of   exogenous cyclic   AMP to   the
growth   media,   the   synthesis   of   glutamate   dehydro- genase increases
while   the   synthesis   of   glutamate   synthase decreases (12).   These
observations   suggest   regulatory   differences, the function   of   which
remain   unresolved   at   present.   Further   studies on   the
inter-relationship   between   the   dehydrogcnase   and   synthase enzymes   in
g. E.  coli   will   be   pursued   with   the   strains

Output:

- glutamate dehydrogenase (protein): The synthesis of this protein increases in
  the presence of cyclic AMP during E. coli growth
- glutamate synthase (protein): The synthesis of this protein decreases in the
  presence of cyclic AMP during E. coli growth
- cyclic AMP (chemical): This chemical was added to the growth media in the
  study
- Escherichia coli (organism): The growth characteristics of this organism were
  studied

Input:

{text}

Output:"""

    res, tokens = await _chat(content)

    # parse the matches
    # split lines and strip list attributes
    lines = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]

    # find scientific name, type, and summary
    def _split(s: str) -> list[str] | None:
        ms = re.match(r"(.*)\((.*)\):?(.*)", s)
        return [x.strip() for x in ms.groups()] if ms else None

    # filter for enabled match types
    translate_types = {"organism": "species", "chemical": "chemical"}
    matches = {
        n.lower(): ResourceMatch(type=translate_types.get(t, t), name=n, summary=s)
        for n, t, s in (x for x in (_split(x) for x in lines) if x is not None)
        if t in options
    }
    species_lower_names = [
        lower_name for lower_name, match in matches.items() if match.type == "species"
    ]
    species_s: list[Species] = (
        (
            await session.execute(
                select(Species).where(func.lower(col(Species.name)).in_(species_lower_names))
            )
        )
        .scalars()
        .all()
    )
    for species in species_s:
        try:
            match = matches[species.name.lower()]
        except KeyError:
            continue
        match.url = f"/species/{species.id}"
        match.name = str(species.name)

    no_match = [(x.type, x.name) for x in matches.values() if x.url is None]
    if len(no_match) > 0:
        print(f"Did not match {no_match}")

    return list(matches.values()), tokens


async def categorize(
    text: str, session: AsyncSession, max_requests: int = 20
) -> tuple[list[ResourceMatch], int]:
    """Split the text and find matches in the database"""
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=3500, overlap=20)
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
