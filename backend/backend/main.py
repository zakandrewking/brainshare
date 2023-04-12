from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai, chat, crossref
from backend.db import get_session
from backend.models import Article, ArticleContent
from backend.schemas import (
    AnnotateRequest,
    AnnotateResponse,
    ChatRequest,
    ChatResponse,
    Document,
    DocumentResponse,
)

# from backend.db import get_redis


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


# TODO auth checks for all these endpoints:


@app.post("/annotate")
async def post_annotate(
    annotate_request: AnnotateRequest,
    session: AsyncSession = Depends(get_session),
    categorize=True,
    tag=True,
    doi=True,
) -> AnnotateResponse:
    if categorize:
        categories, t1 = await ai.categorize(annotate_request.text, session)
    else:
        categories, t1 = [], 0
    if tag:
        tags, t2 = await ai.tag(annotate_request.text)
    else:
        tags, t2 = [], 0
    if doi:
        dois, t3 = await ai.dois(annotate_request.text)
    else:
        dois, t3 = [], 0
    tokens = t1 + t2 + t3
    crossref_work = await crossref.get_best_doi(dois, annotate_request.text)

    # TODO use https://devdojo.com/bobbyiliev/how-to-use-server-sent-events-sse-with-fastapi
    return AnnotateResponse(
        categories=categories, tags=tags, crossref_work=crossref_work, tokens=tokens
    )


@app.post("/document")
async def post_document(
    document: Document, session: AsyncSession = Depends(get_session)
) -> DocumentResponse:
    print(f"Embedding")
    embeddings = await ai.embed(document.text)
    print(f"Saving to db")
    article = Article(name=document.name)
    session.add(article)
    for i, e in enumerate(embeddings):
        session.add(ArticleContent(article=article, chunk=i, embedding=e.embedding, text_=e.text))
    await session.commit()
    await session.refresh(article)
    return DocumentResponse(article_id=article.id)


@app.post("/chat")
async def post_chat(chat_query: ChatRequest) -> ChatResponse:  # , redis: Redis = Depends(get_redis)
    # print(f"Ping successful: {await redis.ping()}")
    response = await chat.chat(chat_query.text)
    return ChatResponse(text=response, tokens=0, cost_dollars=0)
