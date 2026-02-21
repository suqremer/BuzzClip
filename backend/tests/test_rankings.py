import uuid
from datetime import datetime

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_session
from app.main import app
from app.models.user import User
from app.models.video import Video
from app.models.vote_snapshot import VoteSnapshot


@pytest_asyncio.fixture
async def test_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(test_db: AsyncSession):
    async def override_get_session():
        yield test_db

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_trending_endpoint_returns_200(client: AsyncClient):
    response = await client.get("/api/rankings/trending")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_vote_snapshot_creation(test_db: AsyncSession):
    # Create a user
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        display_name="Test User",
    )
    test_db.add(user)
    await test_db.flush()

    # Create a video
    video = Video(
        id=str(uuid.uuid4()),
        tweet_url="https://x.com/test/status/123456",
        tweet_id="123456",
        title="Test Video",
        submitted_by=user.id,
        vote_count=5,
    )
    test_db.add(video)
    await test_db.flush()

    # Create a snapshot
    snapshot = VoteSnapshot(
        id=str(uuid.uuid4()),
        video_id=video.id,
        vote_count=video.vote_count,
        snapshot_at=datetime.utcnow(),
    )
    test_db.add(snapshot)
    await test_db.commit()

    # Verify snapshot was created
    from sqlalchemy import select
    result = await test_db.execute(
        select(VoteSnapshot).where(VoteSnapshot.video_id == video.id)
    )
    snapshots = result.scalars().all()
    assert len(snapshots) == 1
    assert snapshots[0].vote_count == 5
    assert snapshots[0].video_id == video.id
