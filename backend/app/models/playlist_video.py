from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PlaylistVideo(Base):
    __tablename__ = "playlist_videos"
    __table_args__ = (
        UniqueConstraint("playlist_id", "video_id", name="uq_playlist_video"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    playlist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    video_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    playlist = relationship("Playlist", back_populates="playlist_videos", lazy="select")
    video = relationship("Video", lazy="select")
