import os

from asgiref.sync import async_to_sync
from celery import Celery
from celery.schedules import crontab

from backend.doc import annotate
from backend.db import MyAsyncSession
from backend.schemas import Annotations, DocToAnnotate

redis_connection_string = os.environ.get("REDIS_CONNECTION_STRING")
if redis_connection_string is None:
    raise Exception("REDIS_CONNECTION_STRING environment variable not set")

app = Celery("tasks", broker=redis_connection_string, backend=redis_connection_string)
app.conf.timezone = "America/Los_Angeles"

# @app.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
# sender.add_periodic_task(
#     crontab(hour=15, minute=0),
#     scale_down_one_day.s(app="brainshare-pelican-backend-enclave"),
# )


@app.task
def annotate_async(text: str) -> str:
    """Returns a JSON string of the annotations"""

    async def _run(text: str) -> str:
        async with MyAsyncSession() as session:
            annotations = await annotate(text, session)
        return annotations.json()

    return async_to_sync(_run)(text)
