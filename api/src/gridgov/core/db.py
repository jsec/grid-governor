from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from gridgov.core.config import get_settings

_engine: AsyncEngine | None = None


def create_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(settings.database_url, pool_pre_ping=True)


def set_engine(engine: AsyncEngine | None) -> None:
    global _engine
    _engine = engine


def get_engine() -> AsyncEngine:
    if _engine is None:
        raise RuntimeError("engine not initialized")
    return _engine


async def db_tx() -> AsyncIterator[AsyncConnection]:
    async with get_engine().begin() as conn:
        yield conn
