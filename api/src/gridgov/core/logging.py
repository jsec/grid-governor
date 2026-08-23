import uuid
from collections.abc import Awaitable, Callable

import structlog
from starlette.types import ASGIApp, Receive, Scope, Send

from gridgov.core.config import get_settings

Handler = Callable[..., Awaitable[None]]


def configure_logging() -> None:
    settings = get_settings()
    renderer: structlog.types.Processor = (
        structlog.dev.ConsoleRenderer() if settings.debug else structlog.processors.JSONRenderer()
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            renderer,
        ],
    )


class RequestIdMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        structlog.contextvars.bind_contextvars(request_id=str(uuid.uuid4()))

        try:
            await self.app(scope, receive, send)
        finally:
            structlog.contextvars.clear_contextvars()
