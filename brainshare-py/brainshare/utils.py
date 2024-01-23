import asyncio
from typing import Callable

from brainshare import sync


def async_to_sync(func: Callable) -> Callable:
    """Convert an async function to a sync function. Uses nest_asyncio if the
    loop is already running.

    """
    if sync.loop:
        loop = sync.loop
    else:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio  # type: ignore

            nest_asyncio.apply(loop)
            loop = asyncio.new_event_loop()
            sync.loop = loop

    def _go(*args, **kwargs):
        return loop.run_until_complete(func(*args, **kwargs))

    return _go
