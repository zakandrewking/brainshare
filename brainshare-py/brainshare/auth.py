"""Auth for brainshare python SDK

TODO offer an async client so devs have full control over the event loop

"""

import os

# NOTE: warnings.warn sometimes does not appear in jupyter notebooks. I see this
# when I call it twice in certain conditions, though not easy to recreate. So
# don't use it
# from warnings import warn

from dotenv import load_dotenv
from postgrest import AsyncPostgrestClient

from brainshare import config, sync
from brainshare.utils import async_to_sync


def sign_in():
    """Create an interactive brainshare session. Works with the
    interactive (synchronous) commands:

    ```
    import brainshare as br
    br.set_project('default')
    br.query()
    br.sign_out()
    ```

    """
    sign_out(echo=False)

    # unset env vars
    os.environ.pop("BRAINSHARE_API_KEY", None)

    # get environment variables from .env
    load_dotenv()

    api_key = os.environ.get("BRAINSHARE_API_KEY")

    if not api_key:
        # TODO allow password entry with
        # https://stackoverflow.com/questions/70593895/handling-password-in-jupyter-notebook
        print("No API Key found. Provide a valid key as BRAINSHARE_API_KEY in a .env file")
        return

    async def _get():
        client = AsyncPostgrestClient(config.api_url, headers={"x-api-key": api_key})
        sync.client = client
        await client.from_("user").select("*").limit(1).execute()

    try:
        async_to_sync(_get)()
    except Exception as e:
        print("Invalid API Key")
        return

    print("hello brainworld")


def sign_out(echo=True):
    async def _close():
        if sync.client:
            await sync.client.aclose()

    async_to_sync(_close)()

    config.client = None

    if echo:
        print("goodbye brainworld")
