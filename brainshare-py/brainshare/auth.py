import asyncio
from warnings import warn

from postgrest import AsyncPostgrestClient

from brainshare import config


def sign_in(api_key: str):
    config.client = None

    async def _get():
        async with AsyncPostgrestClient(config.api_url, headers={"x-api-key": api_key}) as client:
            await client.from_("chemical").select("*").execute()

    try:
        # # test api_key
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio  # type: ignore

            nest_asyncio.apply()
            loop = asyncio.new_event_loop()
        loop.run_until_complete(_get())
    except Exception as e:
        warn("Invalid API Key")
        return

    print("hello brainworld")


def sign_out():
    config.client = None
    print("goodbye brainworld")
