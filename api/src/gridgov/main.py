from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from gridgov.core.db import create_engine, set_engine
from gridgov.core.errors import register_error_handlers
from gridgov.core.logging import RequestIdMiddleware, configure_logging

api_router = APIRouter(prefix="/api")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    engine = create_engine()
    set_engine(engine)
    try:
        yield
    finally:
        await engine.dispose()
        set_engine(None)


def create_app() -> FastAPI:
    configure_logging()

    app = FastAPI(title="Grid Governor", lifespan=lifespan)
    app.add_middleware(RequestIdMiddleware)

    register_error_handlers(app)
    app.include_router(api_router)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
