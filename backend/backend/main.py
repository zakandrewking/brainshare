# We might want to come back to SSE again at some point. If so, we can use this
# library:
# https://www.npmjs.com/package/sse.js
# Inspired by nat.dev

from fastapi import Depends, FastAPI, Request
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from gotrue.types import User
from sqlalchemy.ext.asyncio import AsyncSession

from backend import chat
from backend.auth import check_session, get_user, get_authenticated_client
from backend.db import get_session
from backend.doc import annotate
from backend.models import Article, SyncedFolder
from backend.schemas import (
    Annotations,
    ArticleRequest,
    ArticleResponse,
    ChatRequest,
    ChatResponse,
    DocToAnnotate,
    FileToAnnotate,
    RunStatus,
    RunAnnotateFileStatus,
    RunAnnotateStatus,
    RunAnnotateTask,
)
from backend.tasks import annotate_async, annotate_file_task, update_synced_folder_task

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


@app.post("/run/update-synced-folder")
def post_run_udpate_synced_folder(
    synced_folder_id: int, supabase=Depends(get_authenticated_client)
):
    access_token = supabase.auth.get_session().access_token
    task = update_synced_folder_task.delay(synced_folder_id, access_token)
    print(f"Task annotate_file_task created with id {task.id}")


@app.post("/run/annotate-file")
def post_run_annotate_file(
    file: FileToAnnotate, request: Request, supabase=Depends(get_authenticated_client)
):
    access_token = supabase.auth.get_session().access_token
    task = annotate_file_task.delay(file, access_token)
    print(f"Task annotate_file_task created with id {task.id}")
    # write the task id to the database
    supabase.table("file").update({"latest_task_id": task.id}).eq("id", file.id).execute()


@app.get("/run/annotate-file/{task_id}")
async def get_run_annotate_file(
    task_id: str, access_token=Depends(check_session)
) -> RunAnnotateFileStatus:
    task = annotate_file_task.AsyncResult(task_id)
    return RunAnnotateFileStatus(status=RunStatus.from_celery_state(task.state))


@app.post("/run/annotate")
def post_run_annotate(
    doc_to_annotate: DocToAnnotate, access_token=Depends(check_session)
) -> RunAnnotateTask:
    print("Creating task annotate_async")
    task = annotate_async.delay(doc_to_annotate.text)
    print(f"Task created with id {task.id}")
    return RunAnnotateTask(task_id=task.id)


@app.get("/run/annotate/{task_id}")
async def get_run_annotate(task_id: str, access_token=Depends(check_session)) -> RunAnnotateStatus:
    task = annotate_async.AsyncResult(task_id)
    if task.ready():
        # TODO handle errors in the task
        # TODO handle timeout in the task
        annotations_json = task.get()
        annotations = Annotations.parse_raw(annotations_json)
        return RunAnnotateStatus(annotations=annotations)
    else:
        return RunAnnotateStatus()


@app.post("/annotate")
async def post_annotate(
    doc: DocToAnnotate,
    access_token=Depends(check_session),
) -> Annotations:
    """Must return within 60 seconds or the fly.io proxy will time out"""
    return await annotate(doc.text)


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


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.

    Should be called only after all routes have been added.
    """
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name  # in this case, 'read_items'


use_route_names_as_operation_ids(app)
