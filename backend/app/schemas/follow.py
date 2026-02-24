from pydantic import BaseModel

from app.schemas.user import UserBriefResponse


class FollowActionResponse(BaseModel):
    status: str


class FollowStatusResponse(BaseModel):
    is_following: bool


class FollowCountsResponse(BaseModel):
    followers_count: int
    following_count: int


class FollowListResponse(BaseModel):
    users: list[UserBriefResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
