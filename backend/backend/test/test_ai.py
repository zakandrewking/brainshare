from backend.ai import embed
from backend.config import EMBEDDING_CTX_LENGTH


async def test_embed():
    result = await embed("one two three" * 10_000)
    assert result[0].embedding == [1, 2, 3]
    assert result[0].length == EMBEDDING_CTX_LENGTH
    assert len(result) == 4
