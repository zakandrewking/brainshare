import asyncio
import re
from dataclasses import dataclass
from itertools import chain, islice

import openai
import tiktoken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from backend.config import EMBEDDING_CTX_LENGTH, EMBEDDING_ENCODING, EMBEDDING_MODEL
from backend.models import Species
from backend.schemas import ResourceMatch

# from
# https://github.com/openai/openai-cookbook/blob/main/examples/Embedding_long_inputs.ipynb


async def get_embedding(text_or_tokens, model) -> list[float]:
    result = await openai.Embedding.acreate(input=text_or_tokens, model=model)
    return result["data"][0]["embedding"]


def batched(iterable, n):
    """Batch data into tuples of length n. The last batch may be shorter."""
    if n < 1:
        raise ValueError("n must be at least one")
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch


def chunk_tokens(text, encoding_name, chunk_length):
    encoding = tiktoken.get_encoding(encoding_name)
    tokens = encoding.encode(text)
    chunks_iterator = batched(tokens, chunk_length)
    yield from chunks_iterator


def decode(tokens, encoding_name):
    encoding = tiktoken.get_encoding(encoding_name)
    return encoding.decode(tokens)


def chunk_text(text, encoding_name, chunk_length):
    chunker = chunk_tokens(text, encoding_name, chunk_length)
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

    chunked = chunk_tokens(text, encoding_name=encoding_name, chunk_length=300)
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


# template = """The following text was extracted from a PDF document:

# {text}

# List the chemical compounds that are mentioned in the article. If you
# find a chemical, provide the name of each chemical on a new line with
# a description, like (chemical Name: Description). If you do not find a
# chemical, say "No chemicals found".
# """


# text = f"""The following text was extracted from a PDF document:

# List the engineered strains that are mentioned in the article. If you
# find an engineered strain, provide the name of each strain on a new line with
# a description, like (Strain Name: Description). If you do not find a
# strain, say "No strains found".
# """


async def _find_species(text: str, session: AsyncSession) -> list[ResourceMatch]:
    # ask for matches
    template = f"""The following text was extracted from a PDF document:

{text}

List the organisms that are being studied in the article. Provide each organism
on a new line like:

- Escherichia coli

If multiple names for an organism are found, then provide them all, like:

- Baker's yeast
- Saccharomyces cerevisiae

If you do not find an organism, say "No organisms found".
"""
    res, tokens = await _chat(template)
    # parse the matches
    match_lines = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]
    # common name, scientific name
    matches: list[tuple[str, str]] = [
        (m.group(1), m.group(2))
        for m in (re.match(r"(.*)\s*\((.*)\)", l) for l in match_lines)
        if m
    ]
    print(matches)
    scientific = [x[1] for x in matches]
    sps = (await session.execute(select(Species.id).where(col(Species.name).in_(scientific)))).all()

    def _build_url(id: int):
        return f"/species/{id}"

    return [ResourceMatch(type="species", name=x.name, url=_build_url(x.id)) for x in sps]


async def _categorize_one(chunk: str, session: AsyncSession) -> tuple[list[ResourceMatch], int]:
    options = ["chemical", "reaction", "protein", "genome", "species"]
    content = f"""The following text was extracted from a PDF document:

{chunk}

We are trying to categorize the document according to categories it
will discuss. The category options are:

{options}

Based on the text extract, list the categories that are likely to
exist in the full text of the article. List one category on each line.
Only provide categories from the category options list.
If no categories are expected, say 'None found'.
"""

    res, tokens = await _chat(content)
    categories = [x for x in options if re.search(rf"\b{x}\b", res)]
    print(f"Categories: {', '.join(categories)}")
    matches: list[ResourceMatch] = []
    if "species" in categories:
        matches += await _find_species(chunk, session)
    return matches, tokens


async def categorize(
    text: str, session: AsyncSession, max_requests: int = 20
) -> tuple[list[ResourceMatch], int]:
    """Split the text and find matches in the database"""
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Categorizing")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    data_list: list[tuple[list[ResourceMatch], int]] = await asyncio.gather(
        *islice((_categorize_one(c, session) for c in chunked), max_requests)
    )
    # flatten and find unique entries
    chunk_categories = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    return chunk_categories, tokens


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
    tags = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]
    # print(f"Tags: {','.join(tags)}")
    tags_filtered = [x for x in tags if "no tags found" not in x]
    return tags_filtered, tokens


async def tag(text: str, max_requests: int = 5) -> tuple[list[str], int]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Generating tags")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    data_list: list[tuple[list[str], int]] = await asyncio.gather(
        *islice((_tag_one(c) for c in chunked), max_requests)
    )
    chunk_tags = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    return chunk_tags, tokens


async def _dois_one(text: str) -> tuple[list[str], int]:
    content = f"""Identify all DOI entries text from this journal
article extract:

{text}

Return each DOI on a new line, formatted as follows. (These are just
examples; do not return them):

- doi:10.1016/j.ymben.2007.08.003
- doi:10.1038/d41586-023-00929-x

If no DOI is found, return only "DOI not found".
"""
    res, tokens = await _chat(content)
    dois = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]
    print(f"DOIs: {','.join(dois)}")
    return [x for x in dois if "doi not found" not in x.lower()], tokens


async def dois(text: str, max_requests: int = 10) -> tuple[list[str], int]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Generating tags")

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    data_list: list[tuple[list[str], int]] = await asyncio.gather(
        *islice((_dois_one(c) for c in chunked), max_requests)
    )
    chunk_tags = list(set(chain.from_iterable(x[0] for x in data_list)))
    tokens = sum(x[1] for x in data_list)
    return chunk_tags, tokens
