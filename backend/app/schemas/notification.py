from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserBriefResponse


class NotificationResponse(BaseModel):
    id: str
    type: str
    actor: UserBriefResponse
    video_id: str | None = None
    video_title: str | None = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    per_page: int
    has_next: bool


class UnreadCountResponse(BaseModel):
    count: int


class MarkReadRequest(BaseModel):
    notification_ids: list[str] | None = None
