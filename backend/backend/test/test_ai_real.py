"""Actually use the openai API. Generally this should be disabled to avoid
spending $$. To enable it, comment out the mock sections in conftest.py"""

from backend.ai import get_embedding
from backend.config import EMBEDDING_MODEL


async def test_get_embedding_short():
    result = await get_embedding(
        text_or_tokens="this is an excerpt of the abstract of the journal article",
        model=EMBEDDING_MODEL,
    )
