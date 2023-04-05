import asyncio


async def semaphore_gather(num, coros, return_exceptions=False):
    """Limit number of coroutines"""
    semaphore = asyncio.Semaphore(num)

    async def _wrap_coro(coro):
        async with semaphore:
            return await coro

    return await asyncio.gather(
        *(_wrap_coro(coro) for coro in coros), return_exceptions=return_exceptions
    )
