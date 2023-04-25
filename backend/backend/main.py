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
    categorize = False
    categorize_max = 20
    tag = False
    doi = False

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


@app.get("/chat")
async def get_chat(
    # chat_query: ChatRequest,
    # user: User = Depends(get_user),
) -> ChatResponse:
    text = "Why do humans anthropomorphize whales? Answer the question with citations and quotes from famous novels and scientific articles, in APA form."
    model = "gpt-4"
    response, tokens = await ai.chat(text, model=model)
    return ChatResponse(text=response, tokens=tokens)
