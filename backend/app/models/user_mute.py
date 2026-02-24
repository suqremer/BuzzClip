from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, utcnow


class UserMute(Base):
    __tablename__ = "user_mutes"
    __table_args__ = (
        UniqueConstraint("user_id", "muted_user_id", name="uq_user_mute"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    muted_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=utcnow
    )

    muted_user = relationship("User", foreign_keys=[muted_user_id], lazy="select")
