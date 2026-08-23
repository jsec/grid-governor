from collections.abc import AsyncIterator, Iterator

import pytest
from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine
from testcontainers.community.postgres import PostgresContainer


@pytest.fixture(scope="session")
def postgres_url() -> Iterator[str]:
    with PostgresContainer("postgres:18.4-alpine", driver="asyncpg") as pg:
        yield pg.get_connection_url()


@pytest.fixture
async def db_conn(postgres_url: str) -> AsyncIterator[AsyncConnection]:
    engine = create_async_engine(postgres_url)

    async with engine.connect() as conn:
        trans = await conn.begin()
        try:
            yield conn
        finally:
            await trans.rollback()

    await engine.dispose()
