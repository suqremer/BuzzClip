import uuid
from datetime import datetime, timezone

from sqlalchemy import event, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _get_async_url(url: str) -> str:
    """Convert DATABASE_URL to async-compatible driver URL."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


database_url = _get_async_url(settings.database_url)

_pool_kwargs = {}
if "sqlite" not in database_url:
    # PostgreSQL pool settings (Railway free tier: max 20 connections)
    _pool_kwargs = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

engine = create_async_engine(database_url, echo=False, **_pool_kwargs)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    """Return current UTC as naive datetime (PostgreSQL TIMESTAMP compatible).

    PostgreSQL TIMESTAMP WITHOUT TIME ZONE columns reject timezone-aware
    datetimes via asyncpg. This helper strips tzinfo after computing UTC.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session


if "sqlite" in settings.database_url:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()


DEFAULT_CATEGORIES = [
    {"slug": "sexy", "name_ja": "セクシー", "icon": "♡", "sort_order": 1},
    {"slug": "japanese", "name_ja": "日本モノ", "icon": "🇯🇵", "sort_order": 2},
    {"slug": "western", "name_ja": "海外モノ", "icon": "🌍", "sort_order": 3},
    {"slug": "amateur", "name_ja": "素人", "icon": "📱", "sort_order": 4},
    {"slug": "cosplay", "name_ja": "コスプレ", "icon": "🎀", "sort_order": 5},
    {"slug": "other", "name_ja": "その他", "icon": "🏷️", "sort_order": 6},
]


async def init_db():
    from app.models import Base as ModelsBase  # noqa: F811
    from app.models.category import Category

    # Create tables (dev convenience; production should use `alembic upgrade head`)
    async with engine.begin() as conn:
        await conn.run_sync(ModelsBase.metadata.create_all)

    # Seed default categories (add missing ones)
    async with async_session() as session:
        result = await session.execute(select(Category.slug))
        existing_slugs = {row[0] for row in result}
        added = False
        for cat_data in DEFAULT_CATEGORIES:
            if cat_data["slug"] not in existing_slugs:
                session.add(Category(id=str(uuid.uuid4()), **cat_data))
                added = True
        if added:
            await session.commit()
