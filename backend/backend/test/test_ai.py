from backend.ai import embed
from backend.config import EMBEDDING_CTX_LENGTH


async def test_embed():
    result = await embed("one two three" * 10_000)
    assert result[0].embedding == [1] * 1536
