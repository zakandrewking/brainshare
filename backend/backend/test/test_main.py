import pytest
from httpx import AsyncClient
from sqlalchemy.future import select

from backend.db import get_session
from backend.main import app
from backend.models import Article
from backend.test.mock import mock_openai_embedding_async


@pytest.mark.asyncio
async def test_read_main():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_document():
    mock_openai_embedding_async()

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/document", json={"name": "test", "text": "abc def"})

    assert response.status_code == 200

    async with await anext(get_session()) as db:
        q = select(Article)
        result = (await db.execute(q)).first()
        assert result[0].id == response.json()["article_id"]

        # TODO clean up
