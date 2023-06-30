from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gotrue.types import User

# from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai, chat, crossref
from backend.auth import get_user
from backend.db import get_session
from backend.models import Article
from backend.schemas import (
    CrossrefWork,
    AnnotateRequest,
    AnnotateResponse,
    ArticleRequest,
    ArticleResponse,
    ChatRequest,
    ChatResponse,
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


@app.post("/annotate")
async def post_annotate(
    annotate_request: AnnotateRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
) -> AnnotateResponse:
    # flags to limit usage during testing
    categorize = True
    categorize_max = 20
    tag = True
    doi = True

    if categorize:
        categories, t1 = await ai.categorize(
            annotate_request.text, session, max_requests=categorize_max
        )
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

    if not doi:  # for debugging
        crossref_work = CrossrefWork(doi="test", title="Fake", authors=[])

    # TODO use https://devdojo.com/bobbyiliev/how-to-use-server-sent-events-sse-with-fastapi
    return AnnotateResponse(
        categories=categories, tags=tags, crossref_work=crossref_work, tokens=tokens
    )


@app.post("/article")
async def post_article(
    article: ArticleRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_user),
) -> ArticleResponse:
    article = Article(
        title=article.crossref_work.title,
        authors=[m.dict() for m in article.crossref_work.authors],
        doi=article.crossref_work.doi,
        journal=article.crossref_work.journal,
        user_id=article.user_id,
    )
    session.add(article)
    await session.commit()
    await session.refresh(article)
    return ArticleResponse(article_id=article.id)


@app.post("/chat")
async def post_chat(
    chat_query: ChatRequest,
    user: User = Depends(get_user),
) -> ChatResponse:
    kwargs = {"model": chat_query.model} if chat_query.model else {}
    print(chat_query)
    response, tokens = await chat.chat(chat_query.history, **kwargs)
    return ChatResponse(content=response, tokens=tokens)
