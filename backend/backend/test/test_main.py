from sqlalchemy.future import select

from backend.models import Article


async def test_read_main(client):
    response = await client.get("/health")
    assert response.status_code == 200


# async def test_document(client, session):
#     response = await client.post("/document", json={"name": "test", "text": "abc def"})
#     assert response.status_code == 200
#     q = select(Article)
#     result = (await session.execute(q)).first()
#     assert result[0].id == response.json()["article_id"]
