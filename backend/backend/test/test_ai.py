import openai

# don't use the real API!
openai.api_key = "FAKE"
openai.api_key_path = None

import pytest

from backend.ai import embed
from backend.config import EMBEDDING_CTX_LENGTH
from backend.test.mock import mock_openai_embedding_async


@pytest.mark.asyncio
async def test_embed():
    mock_openai_embedding_async()

    result = await embed("one two three" * 10_000)

    assert result[0].embedding == [1, 2, 3]
    assert result[0].length == EMBEDDING_CTX_LENGTH
    assert len(result) == 4
