import openai

# don't use the real API!
openai.api_key = "FAKE"
openai.api_key_path = None

from unittest.mock import AsyncMock


def mock_openai_embedding_async():
    mock = AsyncMock()
    mock.return_value = {
        "data": [{"embedding": [1, 2, 3]}],
    }
    openai.Embedding.acreate = mock
