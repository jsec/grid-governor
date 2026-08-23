from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class DomainError(Exception):
    status_code: int = status.HTTP_400_BAD_REQUEST
    title: str = "Bad Request"
    code: str = "bad_request"


class NotFound(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    title = "Not Found"
    code = "not_found"


class Conflict(DomainError):
    status_code = status.HTTP_409_CONFLICT
    title = "Conflict"
    code = "conflict"


class PermissionDenied(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    title = "Forbidden"
    code = "forbidden"


class ValidationFailed(DomainError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    title = "Unprocessable Content"
    code = "validation_failed"


def _problem(error: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={
            "type": "about:blank",
            "title": error.title,
            "status": error.status_code,
            "code": error.code,
            "detail": str(error) or error.title,
        },
        media_type="application/problem+json",
    )


def register_error_handlers(app: FastAPI) -> None:
    async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        return _problem(exc)

    app.add_exception_handler(DomainError, handle_domain_error)  # type: ignore[arg-type]
