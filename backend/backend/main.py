from datetime import datetime, timedelta
from typing import Annotated

from celery import Task
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pytz import UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend import auth, db, models, schemas, tasks

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


@app.post("/task/deploy-app")
async def post_task_deploy_app(
    data: schemas.AppToDeploy,
    session: Annotated[AsyncSession, Depends(db.session)],
    user_id: Annotated[str, Depends(auth.get_user_id)],
) -> None:
    """Clean up any existing tasks and start a new one"""
    print(user_id, data.id)
    app = (
        await session.execute(
            select(models.App)
            .filter(models.App.id == data.id)
            .options(selectinload(models.App.deploy_app_task_link))
        )
    ).scalar_one()
    new_task_link = await run_task_single_instance(
        tasks.deploy_app_task,
        (data.id, user_id),
        {},
        app.deploy_app_task_link,
        "deploy_app",
        user_id,
        session,
        False,
        data.clean_up_only,
    )
    if new_task_link:
        app.deploy_app_task_link = new_task_link
    else:
        app.deploy_app_task_link_id = None
    await session.commit()
