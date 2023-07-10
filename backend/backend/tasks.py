import asyncio
import os

from celery import Celery

from backend.doc import annotate

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


@app.task(time_limit=360, soft_time_limit=300)
def annotate_async(text: str) -> str:
    """Returns a JSON string of the annotations"""

    async def _run(text: str) -> str:
        annotations = await annotate(text)
        return annotations.json()

    return asyncio.get_event_loop().run_until_complete(_run(text))
