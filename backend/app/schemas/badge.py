from pydantic import BaseModel

from app.schemas.user import UserBriefResponse


class BadgeResponse(BaseModel):
    slug: str
    name: str
    description: str
    earned: bool


class BadgeListResponse(BaseModel):
    badges: list[BadgeResponse]


class ContributorResponse(BaseModel):
    rank: int
    user: UserBriefResponse
    vote_count: int


class ContributorRankingResponse(BaseModel):
    contributors: list[ContributorResponse]
    period: str
