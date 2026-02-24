import uuid

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
    {"slug": "funny", "name_ja": "おもしろ", "icon": "😂", "sort_order": 1},
    {"slug": "cats-animals", "name_ja": "猫・動物", "icon": "🐱", "sort_order": 2},
    {"slug": "sports", "name_ja": "スポーツ", "icon": "⚽", "sort_order": 3},
    {"slug": "cooking", "name_ja": "料理", "icon": "🍳", "sort_order": 4},
    {"slug": "heartwarming", "name_ja": "感動", "icon": "✨", "sort_order": 5},
    {"slug": "music", "name_ja": "音楽", "icon": "🎵", "sort_order": 6},
    {"slug": "gaming", "name_ja": "ゲーム", "icon": "🎮", "sort_order": 7},
    {"slug": "news", "name_ja": "ニュース", "icon": "📰", "sort_order": 8},
    {"slug": "tech", "name_ja": "テクノロジー", "icon": "🤖", "sort_order": 9},
    {"slug": "idol", "name_ja": "アイドル", "icon": "🎤", "sort_order": 10},
    {"slug": "sexy", "name_ja": "セクシー", "icon": "♡", "sort_order": 11},
    {"slug": "other", "name_ja": "その他", "icon": "🏷️", "sort_order": 12},
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
