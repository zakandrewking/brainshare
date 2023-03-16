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


class DocumentResponse(BaseModel):
    embeddings: list[list[float]]
    lengths: list[int]
    article_id: int


@app.post("/document")
async def document(
    document: Document, session: AsyncSession = Depends(get_session)
) -> DocumentResponse:
    print(f"Embedding")
    embeddings = await ai.embed(document.text)
    print(f"Saving to db")
    article = Article(name=document.name)
    session.add(article)
    await session.commit()
    await session.refresh(article)
    return DocumentResponse(
        embeddings=[x.embedding for x in embeddings],
        lengths=[x.length for x in embeddings],
        article_id=article.id,
    )
