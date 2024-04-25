import asyncio
from datetime import timedelta
import os

from celery import Celery

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


async def test_task() -> None:
    print("Test task")


@app.task()
def sync_test_task() -> None:
    async def _run() -> None:
        await test_task()

    return asyncio.get_event_loop().run_until_complete(_run())
