from typing import Annotated, Any

from fastapi import Depends


async def current_user() -> Any:
    raise NotImplementedError


def require_role(*roles: str):
    async def _guard(user: Annotated[Any, Depends(current_user)]) -> Any:
        raise NotImplementedError

    return _guard
