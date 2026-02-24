from datetime import datetime

from sqlalchemy import Integer, String, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow

video_tags = Table(
    "video_tags",
    Base.metadata,
    Column("video_id", String(36), ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    video_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=utcnow
    )

    videos = relationship("Video", secondary=video_tags, back_populates="tags", lazy="select")
