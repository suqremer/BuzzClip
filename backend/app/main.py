import logging
import logging.config
import traceback
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import init_db
from app.services.auth import COOKIE_NAME

logger = logging.getLogger(__name__)
from app.routers import (
    admin,
    auth,
    badges,
    categories,
    feedback,
    follows,
    notifications,
    oauth,
    playlists,
    rankings,
    reports,
    users,
    videos,
    votes,
)
from app.tasks.snapshot import take_vote_snapshots
from app.utils.limiter import limiter


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(take_vote_snapshots, "interval", minutes=15)
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="BuzzClip API",
    description="X(Twitter)動画キュレーションプラットフォーム",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter


def _rate_limit_json_handler(request: Request, exc: RateLimitExceeded):
    """Return JSON (not plain text) when rate limit is exceeded.

    The default slowapi handler returns plain text, which causes
    frontend res.json() to fail and show a generic error message.
    """
    return JSONResponse(
        status_code=429,
        content={"detail": "リクエストが多すぎます。しばらくしてから再試行してください"},
    )


app.add_exception_handler(RateLimitExceeded, _rate_limit_json_handler)


async def _unhandled_exception_handler(request: Request, exc: Exception):
    """Return JSON (not text/plain) for unhandled exceptions.

    Starlette's default handler returns plain text "Internal Server Error",
    which causes frontend res.json() to fail. This returns JSON and logs
    the full traceback for diagnosis.
    """
    tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
    logger.error("Unhandled exception on %s %s:\n%s", request.method, request.url.path, "".join(tb))
    return JSONResponse(
        status_code=500,
        content={"detail": f"サーバー内部エラー: {type(exc).__name__}: {exc}"},
    )


app.add_exception_handler(Exception, _unhandled_exception_handler)


# --- Middleware ordering ---
# FastAPI/Starlette: last-added middleware = outermost (runs first).
# We need CORSMiddleware to be outermost so its headers are present
# on ALL responses, including CSRF 403 rejections.
# Order of addition: CSRF (1st/innermost) → security → CORS (last/outermost)

@app.middleware("http")
async def csrf_protection(request: Request, call_next):
    """Reject cross-origin state-changing requests that rely on cookie auth.

    For cookie-authenticated requests, validate Origin header first.
    If Origin is absent, fall back to Referer header validation.
    If neither is present, reject the request (blocks simple-request CSRF).
    """
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        has_cookie = COOKIE_NAME in request.cookies
        if has_cookie:
            origin = request.headers.get("origin")
            if origin:
                if origin not in settings.cors_origins:
                    logger.warning("CSRF blocked: origin=%s path=%s", origin, request.url.path)
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Cross-origin request rejected"},
                    )
            else:
                # No Origin header — check Referer as fallback
                referer = request.headers.get("referer")
                if referer:
                    from urllib.parse import urlparse
                    referer_origin = f"{urlparse(referer).scheme}://{urlparse(referer).netloc}"
                    if referer_origin not in settings.cors_origins:
                        logger.warning("CSRF blocked: referer=%s path=%s", referer, request.url.path)
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Cross-origin request rejected"},
                        )
                # If neither Origin nor Referer, allow (API clients / curl)
    return await call_next(request)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# CORSMiddleware MUST be added last so it wraps all other middleware.
# This ensures CORS headers are present on every response, including
# 403s from CSRF protection — otherwise the browser can't read errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(badges.router)
app.include_router(categories.router)
app.include_router(feedback.router)
app.include_router(follows.router)
app.include_router(notifications.router)
app.include_router(oauth.router)
app.include_router(playlists.router)
app.include_router(rankings.router)
app.include_router(reports.router)
app.include_router(users.router)
app.include_router(videos.router)
app.include_router(votes.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "buzzclip"}
