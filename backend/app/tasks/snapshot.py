import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import async_session
from app.models.video import Video
from app.models.vote_snapshot import VoteSnapshot

logger = logging.getLogger(__name__)


async def take_vote_snapshots():
    """Take a snapshot of current vote counts for all active videos."""
    try:
        async with async_session() as session:
            videos = (await session.execute(
                select(Video).where(Video.is_active == True)  # noqa: E712
            )).scalars().all()
            now = datetime.now(timezone.utc)
            for video in videos:
                snapshot = VoteSnapshot(
                    video_id=video.id,
                    vote_count=video.vote_count,
                    snapshot_at=now,
                )
                session.add(snapshot)

            # Cleanup: remove snapshots older than 7 days
            cutoff = now - timedelta(days=7)
            await session.execute(
                delete(VoteSnapshot).where(VoteSnapshot.snapshot_at < cutoff)
            )

            await session.commit()
            logger.info("Vote snapshots taken for %d videos", len(videos))
    except Exception:
        logger.exception("Failed to take vote snapshots")
