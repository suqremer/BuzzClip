import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from app.database import async_session
from app.models.video import Video
from app.models.vote_snapshot import VoteSnapshot

logger = logging.getLogger(__name__)


async def take_vote_snapshots():
    """Take a snapshot of current vote counts for all active videos."""
    rows = []
    try:
        async with async_session() as session:
            # Only fetch id and vote_count columns to avoid loading full ORM objects
            rows = (await session.execute(
                select(Video.id, Video.vote_count).where(Video.is_active == True)  # noqa: E712
            )).all()
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            for video_id, vote_count in rows:
                snapshot = VoteSnapshot(
                    video_id=video_id,
                    vote_count=vote_count,
                    snapshot_at=now,
                )
                session.add(snapshot)

            # Cleanup: remove snapshots older than 7 days
            cutoff = now - timedelta(days=7)
            await session.execute(
                delete(VoteSnapshot).where(VoteSnapshot.snapshot_at < cutoff)
            )

            await session.commit()
            logger.info("Vote snapshots taken for %d videos", len(rows))
    except Exception:
        logger.exception("Failed to take vote snapshots (processing %d videos)", len(rows))
