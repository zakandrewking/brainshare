import asyncio
from dataclasses import dataclass
from itertools import islice

import openai
import tiktoken

from backend.config import EMBEDDING_CTX_LENGTH, EMBEDDING_ENCODING, EMBEDDING_MODEL

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


@dataclass
class ChunkDetail:
    text: str
    embedding: list[float]


async def _get(chunk, model, encoding_name):
    return ChunkDetail(decode(chunk, encoding_name), await get_embedding(chunk, model))


async def len_safe_get_embedding(
    text,
    model=EMBEDDING_MODEL,
    max_tokens=EMBEDDING_CTX_LENGTH,
    encoding_name=EMBEDDING_ENCODING,
) -> list[ChunkDetail]:
    chunked = chunk_tokens(text, encoding_name=encoding_name, chunk_length=300)
    chunk_details: list[ChunkDetail] = await asyncio.gather(
        *[_get(c, model, encoding_name) for c in chunked]
    )
    return chunk_details


async def embed(text: str) -> list[ChunkDetail]:
    return await len_safe_get_embedding(text)


async def chat(query: str) -> str:
    return (
        (
            await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo", messages=[{"role": "user", "content": query}]
            )
        )
        .choices[0]
        .message.content
    )
