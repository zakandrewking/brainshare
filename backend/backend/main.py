from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai, chat
from backend.db import get_redis, get_session
from backend.models import Article, ArticleContent, ChatRequest, ChatResponse, Document

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def get_health() -> None:
    return


@app.post("/document")
async def post_document(document: Document, session: AsyncSession = Depends(get_session)) -> None:
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


@app.post("/chat")
async def post_chat(chat_query: ChatRequest, redis: Redis = Depends(get_redis)) -> ChatResponse:
    print(f"Ping successful: {await redis.ping()}")
    response = await chat.chat(chat_query.text)
    return ChatResponse(text=response, tokens=0, cost_dollars=0)
