import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, utcnow


class VoteSnapshot(Base):
    __tablename__ = "vote_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vote_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    snapshot_at: Mapped[datetime] = mapped_column(
        nullable=False, default=utcnow
    )
