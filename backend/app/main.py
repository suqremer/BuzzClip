from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import init_db
from starlette.middleware.sessions import SessionMiddleware

from app.routers import auth, categories, oauth, rankings, reports, users, videos, votes
from app.tasks.snapshot import take_vote_snapshots
from app.utils.limiter import limiter


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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret_key)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    return response


app.include_router(auth.router)
app.include_router(oauth.router)
app.include_router(videos.router)
app.include_router(votes.router)
app.include_router(rankings.router)
app.include_router(categories.router)
app.include_router(reports.router)
app.include_router(users.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "buzzclip"}
