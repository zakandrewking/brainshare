from backend.ai import embed


async def test_embed():
    result = await embed("one two three" * 10_000)
    assert result[0].embedding == [1] * 1536
