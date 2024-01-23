"""Globals to manage the synchronous, interactive API."""

import asyncio

from postgrest import PostgrestClient

client: PostgrestClient | None = None
loop: asyncio.AbstractEventLoop | None = None
