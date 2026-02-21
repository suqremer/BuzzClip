from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.services.auth import get_optional_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_feedback(
    request: Request,
    body: FeedbackCreateRequest,
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    feedback = Feedback(
        user_id=current_user.id if current_user else None,
        category=body.category,
        body=body.body,
    )
    session.add(feedback)
    await session.commit()
    await session.refresh(feedback)
    return FeedbackResponse.model_validate(feedback)
