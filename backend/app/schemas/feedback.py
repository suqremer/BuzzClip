from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreateRequest(BaseModel):
    category: str = Field(pattern="^(feature_request|bug_report|other)$")
    body: str = Field(min_length=1, max_length=1000)


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    body: str
    status: str
    created_at: datetime


class FeedbackStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|reviewing|resolved|dismissed)$")
