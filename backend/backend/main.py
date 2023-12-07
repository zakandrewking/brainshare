# We might want to come back to SSE again at some point. If so, we can use this
# library:
# https://www.npmjs.com/package/sse.js
# Inspired by nat.dev

from fastapi import Depends, FastAPI, Request
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from typing import Annotated, Any

from backend import chat
from backend import auth
from backend.doc import annotate
from backend.models import Article
from backend.schemas import (
    Annotations,
    ChatRequest,
    ChatResponse,
    DocToAnnotate,
    RunAnnotateStatus,
    RunAnnotateTask,
    SyncedFolderToUpdate,
)
from backend.tasks import annotate_async, update_synced_folder_task

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
def post_run_update_synced_folder(
    folder: SyncedFolderToUpdate,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
):
    task = update_synced_folder_task.delay(folder.id, user.id)
    print(f"Task annotate_file_task created with id {task.id}")


# @app.post("/run/annotate-file")
# def post_run_annotate_file(file: FileToAnnotate, supabase=Depends(get_authenticated_client)):
#     access_token = supabase.auth.get_session().access_token
#     task = annotate_file_task.delay(file, access_token)
#     print(f"Task annotate_file_task created with id {task.id}")
#     # write the task id to the database
#     supabase.table("file").update({"latest_task_id": task.id}).eq("id", file.id).execute()


# @app.get("/run/annotate-file/{task_id}")
# async def get_run_annotate_file(task_id: str, user=Depends(get_user)) -> RunAnnotateFileStatus:
#     task = annotate_file_task.AsyncResult(task_id)
#     return RunAnnotateFileStatus(status=RunStatus.from_celery_state(task.state))


@app.post("/run/annotate")
def post_run_annotate(
    doc_to_annotate: DocToAnnotate,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> RunAnnotateTask:
    print("Creating task annotate_async")
    task = annotate_async.delay(doc_to_annotate.text, user.id)
    print(f"Task created with id {task.id}")
    return RunAnnotateTask(task_id=task.id)


@app.get("/run/annotate/{task_id}")
async def get_run_annotate(
    task_id: str,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> RunAnnotateStatus:
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
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> Annotations:
    """Must return within 60 seconds or the fly.io proxy will time out"""
    return await annotate(doc.text, user.id)


# @app.post("/article")
# async def post_article(
#     article: ArticleRequest,
#     session: Annotated[AsyncSession, Depends(db.get_session)],
#     user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
# ) -> ArticleResponse:
#     article = Article(
#         title=article.crossref_work.title,
#         authors=[m.dict() for m in article.crossref_work.authors],
#         doi=article.crossref_work.doi,
#         journal=article.crossref_work.journal,
#         user_id=article.user_id,
#     )
#     session.add(article)
#     await session.commit()
#     await session.refresh(article)
#     return ArticleResponse(article_id=article.id)


@app.post("/chat")
async def post_chat(
    chat_query: ChatRequest,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> ChatResponse:
    kwargs = {"model": chat_query.model} if chat_query.model else {}
    print(chat_query)
    response, tokens = await chat.chat(chat_query.history, **kwargs)
    return ChatResponse(content=response, tokens=tokens)


@app.post("/chat-with-context")
async def post_chat_with_context(
    chat_request: ChatRequest,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> ChatResponse:
    return await chat.chat_with_context(chat_request)


# Config


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
