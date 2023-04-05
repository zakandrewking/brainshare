import asyncio
import re
from dataclasses import dataclass
from itertools import islice, chain, islice

import openai
import tiktoken

from backend.config import EMBEDDING_CTX_LENGTH, EMBEDDING_ENCODING, EMBEDDING_MODEL
from backend.util import semaphore_gather

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


async def categorize(text: str, max_requests: int = 10) -> list[str]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Generating categories")
    options = ["chemical", "reaction", "protein", "genome", "species"]
    template = """The following text was extracted from a PDF document:

{chunk}

We are trying to categorize the document according to categories it
will discuss. The category options are:

{options}

Based on the text extract, list the categories that are likely to
exist in the full text of the article. List one category on each line.
Only provide categories from the category options list.
If no categories are expected, say 'None found'.
"""

    async def _query(chunk):
        res = (
            (
                await openai.ChatCompletion.acreate(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "user",
                            "content": template.format(chunk=chunk, options=options),
                        }
                    ],
                )
            )
            .choices[0]
            .message.content
        )
        categories = [x for x in options if re.search(rf"\b{x}\b", res)]
        print(f"Categories: {', '.join(categories)}")
        return categories

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    chunk_categories: list[list[str]] = await asyncio.gather(
        *islice((_query(c) for c in chunked), max_requests)
    )
    return list(set(chain(*chunk_categories)))


async def tag(text: str, max_requests: int = 10) -> list[str]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Generating tags")
    template = """Provide a short list of useful search tags for the document.
List one tag on each line. Provide 5 to 10 tags in total.

Text: The mission's target asteroid was Dimorphos, the secondary member of the
S-type binary near-Earth asteroid (65803) Didymos.
Tags:
- asteroid Dimorphos
- S-type binary near-Earth asteroid

Text: {chunk}

Tags:"""

    async def _query(chunk):
        res = (
            (
                await openai.ChatCompletion.acreate(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "user",
                            "content": template.format(chunk=chunk),
                        }
                    ],
                )
            )
            .choices[0]
            .message.content
        )
        tags = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]
        print(f"Tags: {','.join(tags)}")
        return [x for x in tags if "no tags found" not in x]

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    chunk_tags: list[list[str]] = await asyncio.gather(
        *islice((_query(c) for c in chunked), max_requests)
    )
    return list(set(chain(*chunk_tags)))


async def dois(text: str, max_requests: int = 10) -> list[str]:
    if max_requests > 20:
        raise Exception("Should use util.semaphore_gather")

    print("Generating tags")
    template = """Identify all DOI entries text from this journal
article extract:

{chunk}

Return each DOI on a new line, formatted as follows. (These are just
examples; do not return them):

- doi:10.1016/j.ymben.2007.08.003
- doi:10.1038/d41586-023-00929-x

If no DOI is found, return only "DOI not found".
"""

    async def _query(chunk):
        res = (
            (
                await openai.ChatCompletion.acreate(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "user",
                            "content": template.format(chunk=chunk),
                        }
                    ],
                )
            )
            .choices[0]
            .message.content
        )
        dois = [re.sub(r"^\s*([0-9.+-]+\s+)?", "", x).strip() for x in res.split("\n")]
        print(f"DOIs: {','.join(dois)}")
        return [x for x in dois if "doi not found" not in x.lower()]

    chunked = chunk_text(text, encoding_name=EMBEDDING_ENCODING, chunk_length=1000)
    chunk_tags: list[list[str]] = await asyncio.gather(
        *islice((_query(c) for c in chunked), max_requests)
    )
    return list(set(chain(*chunk_tags)))
