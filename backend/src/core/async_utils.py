import asyncio
from typing import Any, Coroutine

_worker_loop: asyncio.AbstractEventLoop | None = None


def get_worker_loop() -> asyncio.AbstractEventLoop:
    global _worker_loop

    if _worker_loop is None or _worker_loop.is_closed():
        _worker_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_worker_loop)

    return _worker_loop


def run_async(coro: Coroutine[Any, Any, Any]) -> Any:
    loop = get_worker_loop()
    return loop.run_until_complete(coro)
