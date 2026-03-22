"""Lumo FastAPI application."""

# Load backend/.env FIRST, before any module reads os.environ.
from backend.app.core.env import load_env
load_env()

import time

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.api.auth import auth_router
from backend.app.api.routes import router
from backend.app.db import init_db
from backend.app.observability import configure_logging, get_logger, new_trace_id

configure_logging()
_log = get_logger("app")


# ---------------------------------------------------------------------------
# Request/response logging middleware
# ---------------------------------------------------------------------------

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Lightweight middleware that logs method, path, status, and duration."""

    _SKIP_PATHS = {"/health", "/"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self._SKIP_PATHS:
            return await call_next(request)

        trace_id = new_trace_id()
        request.state.trace_id = trace_id
        start = time.perf_counter()

        response: Response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 1)
        _log.info(
            "%s %s %d %.1fms",
            request.method, request.url.path, response.status_code, duration_ms,
            extra={
                "stage": "http",
                "trace_id": trace_id,
            },
        )
        return response


app = FastAPI(title="Lumo", version="0.1.0")
app.add_middleware(RequestLoggingMiddleware)
app.include_router(router)
app.include_router(auth_router)


@app.on_event("startup")
def startup():
    _log.info("Application startup – initializing database", extra={"stage": "app"})
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    """Default root endpoint to avoid 404 and provide basic service info."""
    return {
        "name": "Lumo",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }
