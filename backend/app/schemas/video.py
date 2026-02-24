from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserBriefResponse


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    slug: str
    name_ja: str
    icon: str | None = None
    video_count: int = 0


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str


class VideoSubmitRequest(BaseModel):
    url: str = Field(max_length=2048)
    category_slugs: list[str] = Field(default=[], max_length=3)
    title: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=200)


class VideoUpdateRequest(BaseModel):
    comment: str | None = Field(default=None, max_length=200)
    category_slugs: list[str] | None = Field(default=None, max_length=3)


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
    comment: str | None = None
    categories: list[CategoryResponse] = []
    tags: list[TagResponse] = []
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
