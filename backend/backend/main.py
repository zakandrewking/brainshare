from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gotrue.types import User
from sqlalchemy.ext.asyncio import AsyncSession

from backend import ai, chat, crossref
from backend.auth import get_user
from backend.db import get_session
from backend.models import Article
from backend.schemas import (
    AnnotateRequest,
    AnnotateResponse,
    ArticleRequest,
    ArticleResponse,
    ChatRequest,
    ChatResponse,
    CrossrefWork,
)

# from redis.asyncio import Redis
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


# TODO this is finicky, so let's replace with a Redis job tracker, with Celery
# if it's useful, and a simple polling mechanism

# STREAM_DELAY = 1  # second
# RETRY_TIMEOUT = 15000  # milisecond

# @app.get("/stream")
# async def message_stream(request: Request, user: User = Depends(get_user)):
#     """
#     Server-side requirements:
#     - "Last-Event-ID" is sent in a query string (CORS + "Last-Event-ID" header is not supported by all browsers)
#     - It is required to send 2 KB padding for IE < 10 and Chrome < 13 at the top of the response stream (the polyfill sends padding=true query argument)
#     - You need to send "comment" messages each 15-30 seconds, these messages will be used as heartbeat to detect disconnects - see https://bugzilla.mozilla.org/show_bug.cgi?id=444328
#     """

#     def new_messages():
#         # Add logic here to check for new messages
#         yield "Hello World"

#     async def event_generator():
#         for i in range(10):
#             # If client closes connection, stop sending events
#             if await request.is_disconnected():
#                 break

#             # Checks for new messages and return them to client if any
#             if new_messages():
#                 yield {
#                     "event": "new_message",
#                     "id": "message_id",
#                     "retry": RETRY_TIMEOUT,
#                     "data": "message_content",
#                 }

#             await asyncio.sleep(STREAM_DELAY)

#     return EventSourceResponse(event_generator())
