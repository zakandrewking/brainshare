import asyncio
import os

from celery import Celery

from backend.doc import annotate

redis_connection_string = os.environ.get("REDIS_CONNECTION_STRING")
if redis_connection_string is None:
    raise Exception("REDIS_CONNECTION_STRING environment variable not set")

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
app.conf.redis_socket_connect_timeout = 2
app.conf.redis_socket_timeout = 10
app.conf.redis_socket_keepalive = True
# we'll rely on the celery retry mechanism instead
app.conf.redis_retry_on_timeout = False

# @app.on_after_configure.connect
# def setup_periodic_tasks(sender, **kwargs):
# sender.add_periodic_task(
#     crontab(hour=15, minute=0),
#     scale_down_one_day.s(app="brainshare-pelican-backend-enclave"),
# )


@app.task()
def annotate_async(text: str) -> str:
    """Returns a JSON string of the annotations"""

    async def _run(text: str) -> str:
        annotations = await annotate(text)
        return annotations.json()

    return asyncio.get_event_loop().run_until_complete(_run(text))
