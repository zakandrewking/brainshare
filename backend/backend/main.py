"""
Design Spec: Use this for:
- Creating and tracking long running celery tasks
"""

# We might want to come back to SSE again at some point. If so, we can use this
# library:
# https://www.npmjs.com/package/sse.js
# Inspired by nat.dev

from datetime import datetime, timedelta
from typing import Annotated

from celery import Task
from fastapi import Depends, FastAPI
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend import db
from backend import chat
from backend import dataset
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
from datetime import datetime, timedelta
from pytz import UTC

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----
# Utils
# -----


async def run_task_single_instance(
    task: Task,
    task_args: tuple,
    task_kwargs: dict,
    task_link: models.TaskLink | None,
    task_link_type: str,
    user_id: str,
    session: AsyncSession,
    force_cancel: bool,
    clean_up_only: bool,
) -> models.TaskLink | None:
    """Run the given task or cleaning up the existing task.

    We don't have a realtime sync between celery results and the database, to
    track failures, so we check for results on demand.

    Does not commit!

    Arguments:
    - task: the task to run
    - task_args: the arguments to pass to the task
    - task_kwargs: the keyword arguments to pass to the task
    - task_link: The existing TaskLink if it exists for this resource & sync type.
    - session: The database session
    - force_cancel: whether to force cancel the task
    - clean_up_only: only clean up the task; don't start a new one

    """

    if force_cancel:
        raise NotImplementedError

    if task_link:
        if task_link.type != task_link_type:
            raise ValueError(
                f"TaskLink type {task_link.type} does not match expected type {task_link_type}"
            )

        if task_link.task_finished_at is not None:
            # if the task is finished, we don't need to do anything
            print(f"Task {task_link.task_id} is already finished")
            if clean_up_only:
                return task_link
        else:
            task_result = task.AsyncResult(task_link.task_id)

            is_within_1_day = task_link.task_created_at > datetime.now(UTC) - timedelta(days=1)
            if task_result.status == "PENDING":
                # PENDING in celery means waiting for execution or "i don't know":
                # https://github.com/celery/celery/issues/3596 To differentiate
                # between a task has not started and a task that is finished and
                # deleted, we only consider tasks IDs that were created in the last
                # 1 day, we and configure results to be stored for 7 days
                # (result_expires tasks.py). Older tasks are assumed to be finished
                # after 1 day -- hung tasks will be caught by monitoring.
                if is_within_1_day:
                    print(f"Task {task_link.task_id} is queued or running (within 24 hrs)")
                    # Error to a start a job while one is running
                    if clean_up_only:
                        print("Done cleaning up")
                        return task_link
                    else:
                        raise Exception(
                            f"task {task_link.id} (type {task_link.type}) is already running (pending)"
                        )
                else:
                    # TODO we don't want to set task_finished_at because we don't
                    # know it finished, but we also don't want to keep tracking it.
                    # so just return None which will unlink to the old task
                    print(f"Task {task_link.task_id} is assumed to be finished (older than 24 hrs)")
                    if clean_up_only:
                        print("Done cleaning up")
                        return None
            elif task_result.status == "FAILURE":
                # The task raised an exception, or has exceeded the retry limit. The
                # result attribute then contains the exception raised by the task.
                error = task_result.result
                print(f"Task failed. Updating task_link with error {error}")
                task_link.task_error = str(error)
                task_link.task_finished_at = task_result.date_done or datetime.now(UTC)
                # if not cleanup, we'll still start a new job
                if clean_up_only:
                    print("Done cleaning up")
                    return task_link
            elif task_result.status == "RETRY":
                # The task is to be retried, possibly because of failure.
                print(f"Task {task_link.task_id} is being retried")
                # Error to a start a job while one is running
                if clean_up_only:
                    print("Done cleaning up")
                    return task_link
                else:
                    raise Exception(
                        f"task {task_link.id} (type {task_link.type}) is already running (retrying)"
                    )
            elif task_result.status == "SUCCESS":
                # The task executed successfully. The result attribute then contains
                # the tasks return value.
                print("Task finished successfully")
                task_link.task_finished_at = task_result.date_done or datetime.now(UTC)
                if clean_up_only:
                    print("Done cleaning up")
                    return task_link
            elif task_result.status == "STARTED":
                # The task has been started.
                print(f"Task {task_link.task_id} has been started")
                # Error to a start a job while one is running
                if clean_up_only:
                    print("Done cleaning up")
                    return task_link
                else:
                    raise Exception(
                        f"task {task_link.id} (type {task_link.type}) is already running (started)"
                    )
            else:
                raise ValueError(f"Unexpected task status {task_result.status}")

    # if we get here, we need to start a new task
    new_task_result = task.delay(*task_args, **task_kwargs)
    new_task_link = models.TaskLink(
        task_id=new_task_result.id,
        user_id=user_id,
        type=task_link_type,
    )
    session.add(new_task_link)

    await session.flush()
    print(f"{task.name} created with id {new_task_result.id}")

    return new_task_link


# -----------
# Healthcheck
# -----------


@app.get("/health")
def get_health() -> None:
    return


# ----------------------
# Sync files to datasets
# ----------------------

# NOTE: We'd get sync status with a GET request to /task/sync-file-to-dataset/{task_id}


@app.post("/task/sync-file-to-dataset")
async def post_task_sync_file_to_dataset(
    data: schemas.SyncedFileDatasetMetadataToUpdate,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    """Clean up any existing tasks and start a new one"""
    synced_file_dataset_metadata = (
        await session.execute(
            (
                select(models.SyncedFileDatasetMetadata)
                .filter(models.SyncedFileDatasetMetadata.id == data.synced_file_dataset_metadata_id)
                .options(
                    selectinload(models.SyncedFileDatasetMetadata.sync_file_to_dataset_task_link)
                )
            )
        )
    ).scalar_one()
    if not synced_file_dataset_metadata:
        raise ValueError(
            f"synced_file_dataset_metadata {data.synced_file_dataset_metadata_id} not found"
        )

    new_task_link = await run_task_single_instance(
        tasks.sync_file_to_dataset,
        (data.synced_file_dataset_metadata_id, user.id, user.access_token),
        {},
        synced_file_dataset_metadata.sync_file_to_dataset_task_link,
        "sync_file_to_dataset",
        user.id,
        session,
        data.force_cancel,
        data.clean_up_only,
    )

    if new_task_link:
        synced_file_dataset_metadata.sync_file_to_dataset_task_link = new_task_link
    else:
        synced_file_dataset_metadata.sync_file_to_dataset_task_link_id = None
    await session.commit()


# ------------------------------
# Sync folders from Google Drive
# ------------------------------


# Design Doc: This is the prototype for an async job with UX.

# Pull from the remote folder and process the top level files. To ensure
# one-at-a-time execution, we will store task IDs on
# synced_folder.update_task_id / update_task_created_at


@app.post("/task/sync-folder")
async def post_task_sync_folder(
    data: SyncedFolderToUpdate,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    """Clean up any existing tasks and start a new one"""

    synced_folder = (
        await session.execute(
            (
                select(models.SyncedFolder)
                .filter(models.SyncedFolder.id == data.synced_folder_id)
                .options(selectinload(models.SyncedFolder.sync_folder_task_link))
            )
        )
    ).scalar_one()
    if not synced_folder:
        raise ValueError(f"Synced folder {data.synced_folder_id} not found")

    new_task_link = await run_task_single_instance(
        tasks.sync_folder,
        (data.synced_folder_id, data.synced_file_folder_id, user.id, user.access_token),
        {},
        synced_folder.sync_folder_task_link,
        "sync_folder",
        user.id,
        session,
        data.force_cancel,
        data.clean_up_only,
    )

    # connect to folder
    if new_task_link:  # for sqlalchemy-mypy to be happy, we need to separate this out
        synced_folder.sync_folder_task_link = new_task_link
    else:
        synced_folder.sync_folder_task_link_id = None
    await session.commit()


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


# ----
# Chat
# ----


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


# ------------------
# Dataset management
# ------------------


@app.post("/create-dataset")
async def post_create_dataset(
    dataset_request: schemas.CreateDatasetRequest,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> int:
    """this will be synchronous for now. returns dataset_metadata.id.
    Asynchronously starts the first data sync."""

    dataset_metadata, _ = await dataset.create_dataset_start_sync(
        dataset_request.dataset_name,
        dataset_request.synced_file_id,
        session,
        user.id,
        user.access_token,
    )
    return dataset_metadata.id


@app.post("/delete-dataset")
async def post_delete_dataset(
    dataset_request: schemas.DeleteDatasetRequest,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    return await dataset.delete_dataset(dataset_request.dataset_metadata_id, session, user.id)


@app.post("/dataset-columns")
async def post_dataset_columns(
    dataset_request: schemas.DatasetColumnsRequest,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> list[str]:
    """PostgREST-js cannot return columns for an empty dataset, so we provide a
    method here. https://github.com/supabase/postgrest-js/issues/427

    """
    return await dataset.get_dataset_columns(dataset_request.dataset_metadata_id, session, user.id)


# ------------------
# Project management
# ------------------

# A project more or less equal to a schema in the database. If we want to query
# across projects, we can duplicate a dataset including the file source so that
# syncing applies to both old and new datasets. Or, we can create a feature that
# links a dataset in one project to a read-only dataset in another.

# If a user requests a full account deletion, we'll have to also delete all
# their projects, datasets, schemas, and associated postgres roles.

# To make testing easier, we'll start with a management function that cleans up
# a schema & role.


@app.post("/create-project")
async def post_create_project(
    project_request: schemas.CreateProjectRequest,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> schemas.CreateProjectResponse:
    project = models.Project(name=project_request.name, user_id=user.id)
    session.add(project)
    # await dataset.create_schema(user.id, session)
    await session.commit()
    return schemas.CreateProjectResponse(
        id=project.id,
        created_at=project.created_at.isoformat(),
    )


@app.post("/delete-project")
async def post_delete_project(
    project_request: schemas.DeleteProjectRequest,
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    raise NotImplementedError("need to delete schema")
    project = (
        await session.execute(
            select(models.Project).filter(models.Project.id == project_request.id)
        )
    ).scalar_one()
    if not project:
        raise ValueError(f"Project {project_request.id} not found")
    await session.delete(project)
    await session.commit()


@app.post("/delete-schema")
async def post_delete_schema(
    session: Annotated[AsyncSession, Depends(db.session)],
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> None:
    await dataset.delete_schema(user.id, session)


# --------------------------
# Old PDF Annotation feature
# --------------------------


@app.post("/task/annotate")
def post_run_annotate(
    doc_to_annotate: DocToAnnotate,
    user: Annotated[auth.User, Depends(auth.current_user)],  # authorize
) -> RunAnnotateTask:
    print("Creating task annotate_async")
    task = annotate_async.delay(doc_to_annotate.text, user.id)
    print(f"Task created with id {task.id}")
    return RunAnnotateTask(task_id=task.id)


@app.get("/task/annotate/{task_id}")
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


# ------
# Config
# ------


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
