from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserBriefResponse


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name_ja: str
    icon: str | None = None
    video_count: int = 0


class VideoSubmitRequest(BaseModel):
    url: str
    category_slugs: list[str] = []
    title: str | None = None


class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    external_id: str
    platform: str = "x"
    author_name: str | None = None
    author_url: str | None = None
    oembed_html: str | None = None
    title: str | None = None
    categories: list[CategoryResponse] = []
    vote_count: int = 0
    user_voted: bool = False
    is_trending: bool = False
    submitted_by: UserBriefResponse | None = None
    created_at: datetime


class VideoListResponse(BaseModel):
    items: list[VideoResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    trending_count: int = 0
