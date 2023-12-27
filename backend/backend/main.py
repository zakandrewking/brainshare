# We might want to come back to SSE again at some point. If so, we can use this
# library:
# https://www.npmjs.com/package/sse.js
# Inspired by nat.dev

from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from backend import db
from backend import chat
from backend import auth
from backend.doc import annotate
from backend.schemas import (
    Annotations,
    ChatRequest,
    ChatResponse,
    DocToAnnotate,
    RunAnnotateStatus,
    RunAnnotateTask,
    SyncedFolderToUpdate,
)
from backend import tasks
from backend import models
from backend import schemas
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


# --------------------
# Update Synced Folder
# --------------------

# Design Doc: This is the prototype for an async job with UX.

# Pull from the remote folder and process the top level files. To ensure
# one-at-a-time execution, we will store task IDs on
# synced_folder.update_task_id / update_task_created_at


@app.post("/run/update-synced-folder")
async def post_run_update_synced_folder(
    folder: SyncedFolderToUpdate,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    synced_folder = await session.get(models.SyncedFolder, folder.synced_folder_id)
    if not synced_folder:
        raise ValueError(f"Synced folder {folder.synced_folder_id} not found")

    # Clean up existing task. We don't have a realtime sync between celery
    # results and the database, to track failures, so we check for results on
    # demand. TODO for successes, the task can write to the database; that's the
    # fast path. need to implement
    # TODO generalize this approach
    task_id = synced_folder.update_task_id
    if task_id:
        task = update_synced_folder_task.AsyncResult(task_id)
        # PENDING in celery means "i don't know":
        # https://github.com/celery/celery/issues/3596 To differentiate between
        # a task has not started and a task that is finished and deleted, we
        # only consider tasks IDs that were created in the last 1 day, we and
        # configure results to be stored for 7 days (result_expires tasks.py).
        # Older tasks are assumed to be finished after 1 day -- hung tasks will
        # be caught by monitoring.
        if synced_folder.update_task_created_at is None:
            print("Did not find update_task_created_at")
            # clean up
            synced_folder.update_task_id = None
            synced_folder.update_task_error = None
            await session.commit()
            # we might as well continue with the new sync job now that this is fixed
        else:
            is_within_1_day = synced_folder.update_task_created_at > datetime.now() - timedelta(
                days=1
            )
            if task.status == "PENDING" and is_within_1_day:
                print(f"Task {task_id} is queued or running")
                if folder.force_cancel:
                    raise NotImplementedError
                # Error to a start a job while one is running
                if not folder.clean_up_only:
                    raise Exception(
                        f"Update job for synced folder {folder.synced_folder_id} is already running"
                    )
            else:
                if task.status == "FAILURE":
                    error = task.result
                    print(f"Task failed. Updating synced_folder with error {error}")
                    synced_folder.update_task_error = str(error)
                    synced_folder.update_task_id = None
                    synced_folder.update_task_created_at = None
                    await session.commit()
                    # if not cleanup, we'll still start a new job
                else:
                    # finished successfully
                    print("Task finished successfully")
                    synced_folder.update_task_id = None
                    synced_folder.update_task_error = None
                    synced_folder.update_task_created_at = None
                    await session.commit()

    if folder.clean_up_only:
        print("Done cleaning up")
        return

    task = update_synced_folder_task.delay(
        folder.synced_folder_id, folder.synced_file_folder_id, user.id
    )
    synced_folder.update_task_id = task.id
    synced_folder.update_task_created_at = datetime.now()
    synced_folder.update_task_error = None
    await session.commit()
    print(f"Task annotate_file_task created with id {task.id}")


# not sure if we'll need this, because we're going for realtime updates
# @app.get("/run/update-synced-folder/{task_id}")
# async def get_run_update_synced_folder(
#     task_id: str,
#     user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
# ) -> schemas.UpdateSyncedFolderStatus:
#     task = update_synced_folder_task.AsyncResult(task_id)
#     status = schemas.RunStatus.from_celery_state(task.state)
#     error = None
#     # result contains the exception occurred, and traceback contains the
#     # backtrace of the stack at the point when the exception was raised
#     if status == schemas.RunStatus.failed:
#         error = task.result
#     return schemas.UpdateSyncedFolderStatus(status=status, error=error)


# TODO for the long running version of this job, make it cancelable
# @app.delete("/run/update-synced-folder/{task_id}")
# async def delete_run_update_synced_folder(
#     task_id: str,
#     user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
# ) -> None:
#     task = update_synced_folder_task.AsyncResult(task_id)
# use abortable
# task.revoke(terminate=True)
# return schemas.UpdateSyncedFolderStatus(status=schemas.RunStatus.revoked)
# return


@app.post("/run/update-synced-file")
def post_run_update_synced_file(
    synced_file_id: int,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
):
    task = tasks.update_synced_file_task.delay(synced_file_id, user.id)
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
