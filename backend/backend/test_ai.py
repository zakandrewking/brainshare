import openai

# don't use the real API!
openai.api_key = "FAKE"
openai.api_key_path = None

import re

import pytest
from aioresponses import aioresponses
from unittest.mock import AsyncMock

from backend.config import EMBEDDING_CTX_LENGTH

from . import ai


@pytest.mark.asyncio
async def test_embed():
    mock = AsyncMock()
    mock.return_value = {
        "data": [{"embedding": [1, 2, 3]}],
    }
    openai.Embedding.acreate = mock

    result = await ai.embed("one two three" * 10_000)

    assert result[0].embedding == [1, 2, 3]
    assert result[0].length == EMBEDDING_CTX_LENGTH
    assert len(result) == 4
