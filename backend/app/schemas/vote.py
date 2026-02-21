from pydantic import BaseModel


class VoteResponse(BaseModel):
    video_id: str
    new_vote_count: int
    user_voted: bool
