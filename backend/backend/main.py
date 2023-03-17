from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai
from backend.db import get_session
from backend.models import Article, ArticleContent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> None:
    return


class Document(BaseModel):
    name: str
    text: str


@app.post("/document")
async def document(document: Document, session: AsyncSession = Depends(get_session)) -> None:
    print(f"Embedding")
    embeddings = await ai.embed(document.text)
    print(f"Saving to db")
    article = Article(name=document.name)
    session.add(article)
    for i, e in enumerate(embeddings):
        session.add(ArticleContent(article=article, chunk=i, embedding=e.embedding, text=e.text))
    await session.commit()
    await session.refresh(article)
    return
