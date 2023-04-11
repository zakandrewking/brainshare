import asyncio
from collections import deque
from html.parser import HTMLParser
from io import StringIO
from typing import Iterable, Iterator, TypeVar


async def semaphore_gather(num, coros, return_exceptions=False):
    """Limit number of coroutines"""
    semaphore = asyncio.Semaphore(num)

    async def _wrap_coro(coro):
        async with semaphore:
            return await coro

    return await asyncio.gather(
        *(_wrap_coro(coro) for coro in coros), return_exceptions=return_exceptions
    )


T = TypeVar("T")


def batched(iterable: Iterable[T], chunk_size: int, overlap: int) -> Iterator[tuple[T, ...]]:
    """Batch data into tuples of the given length and overlap. The last batch
    may be shorter.

    From https://stackoverflow.com/a/36586925

    """
    # we'll use a deque to hold the values because it automatically
    # discards any extraneous elements if it grows too large
    if chunk_size < 1:
        raise ValueError("chunk size too small")
    if overlap >= chunk_size:
        raise ValueError("overlap too large")
    queue: deque[T] = deque(maxlen=chunk_size)
    itr = iter(iterable)
    i = 0
    try:
        # start by filling the queue with the first group
        for i in range(chunk_size):
            queue.append(next(itr))
        while True:
            yield tuple(queue)
            # after yielding a chunk, get enough elements for the next chunk
            for i in range(chunk_size - overlap):
                queue.append(next(itr))
    except StopIteration:
        # if the iterator is exhausted, yield any remaining elements
        i += overlap
        if i > overlap:
            yield tuple(queue)[-i:]


class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = StringIO()

    def handle_data(self, d):
        self.text.write(d)

    def get_data(self):
        return self.text.getvalue()


def strip_tags(html):
    """from https://stackoverflow.com/a/925630"""
    s = MLStripper()
    s.feed(html)
    return s.get_data()
