from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.user import User
from app.schemas.badge import BadgeListResponse
from app.services.badges import compute_badges

router = APIRouter(prefix="/api/badges", tags=["badges"])


@router.get("/{user_id}", response_model=BadgeListResponse)
async def get_user_badges(
    user_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    badges = await compute_badges(user_id, session)
    return BadgeListResponse(badges=badges)
