from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserBriefResponse
from app.schemas.video import VideoResponse


class PlaylistCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    is_public: bool = True


class PlaylistUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    is_public: bool | None = None


class PlaylistBriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    is_public: bool
    video_count: int = 0
    created_at: datetime


class PlaylistDetailResponse(BaseModel):
    id: str
    name: str
    is_public: bool
    owner: UserBriefResponse
    videos: list[VideoResponse]
    created_at: datetime


class PlaylistVideoRequest(BaseModel):
    video_id: str


class PlaylistListResponse(BaseModel):
    playlists: list[PlaylistBriefResponse]
