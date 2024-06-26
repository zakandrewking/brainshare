# TODO consider switching to hatchet https://github.com/hatchet-dev/hatchet

import asyncio
from datetime import timedelta
import os

from celery import Celery

from backend import doc, file, schemas


redis_connection_string = os.environ.get("REDIS_CONNECTION_STRING")
if redis_connection_string is None:
    # don't throw an error on import
    print("REDIS_CONNECTION_STRING environment variable not set")

app = Celery("tasks", broker=redis_connection_string, backend=redis_connection_string)
app.conf.timezone = "America/Los_Angeles"
# timing
app.conf.task_time_limit = 360
app.conf.task_soft_time_limit = 300
# redis broker
app.conf.broker_transport_options = {
    "visibility_timeout": 3600,
    "max_retries": 4,
    "interval_start": 0,
    "interval_step": 0.2,
    "interval_max": 1,
    "timeout": 10,
    # for redis:
    "health_check_interval": 60,
    "socket_connect_timeout": 2,
    "socket_timeout": 10,
    "socket_keepalive": True,
    # we'll rely on the celery retry mechanism instead
    "retry_on_timeout": False,
}
# redis backend
app.conf.result_backend_transport_options = {
    "retry_policy": {
        "max_retries": 4,
        "interval_start": 0,
        "interval_step": 0.2,
        "interval_max": 1,
        "timeout": 10,
    }
}
app.conf.redis_backend_health_check_interval = 60
app.conf.result_expires = timedelta(days=7)
app.conf.redis_socket_connect_timeout = 2
app.conf.redis_socket_timeout = 10
app.conf.redis_socket_keepalive = True
# we'll rely on the celery retry mechanism instead
app.conf.redis_retry_on_timeout = False
# Set the default serializer to 'pickle' which supports pydantic models
app.conf.accept_content = ["pickle"]
app.conf.task_serializer = "pickle"
app.conf.result_serializer = "pickle"


# @app.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
# sender.add_periodic_task(
#     crontab(hour=15, minute=0),
#     scale_down_one_day.s(app="brainshare-pelican-backend-enclave"),
# )

# ------------
# Celery tasks
# ------------

# These should be boilerplate; no business logic.


@app.task()
def sync_file_to_dataset(
    synced_file_dataset_metadata_id: int, user_id: str, access_token: str
) -> None:
    async def _run() -> None:
        await file.sync_file_to_dataset(synced_file_dataset_metadata_id, user_id, access_token)

    return asyncio.get_event_loop().run_until_complete(_run())


@app.task()
def sync_folder(
    synced_folder_id: int, synced_file_folder_id: int | None, user_id: str, access_token: str
) -> None:
    async def _run() -> None:
        await file.sync_folder(synced_folder_id, synced_file_folder_id, user_id, access_token)

    return asyncio.get_event_loop().run_until_complete(_run())


@app.task()
def annotate_file_task(data: schemas.FileToAnnotate, access_token: str) -> None:
    """Processes a file and saves the annotations to the database"""

    async def _run() -> None:
        await file.annotate_file(data, access_token)

    return asyncio.get_event_loop().run_until_complete(_run())


# TODO remove this
@app.task()
def annotate_async(text: str, user_id: str) -> str:
    """Returns a JSON string of the annotations"""

    async def _run(text: str) -> str:
        annotations = await doc.annotate(text, user_id)
        return annotations.json()

    return asyncio.get_event_loop().run_until_complete(_run(text))
