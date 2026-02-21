from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.user import User
from app.models.video import Video
from app.models.vote import Vote
from app.schemas.user import UserBriefResponse
from app.services.auth import get_optional_user
from app.utils.response import video_to_response

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}")
async def get_public_profile(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    # Get user
    result = await session.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    # Count submitted videos
    total_result = await session.execute(
        select(func.count())
        .select_from(Video)
        .where(Video.submitted_by == user_id, Video.is_active == True)  # noqa: E712
    )
    total = total_result.scalar() or 0

    # Fetch submitted videos (paginated)
    result = await session.execute(
        select(Video)
        .where(Video.submitted_by == user_id, Video.is_active == True)  # noqa: E712
        .options(selectinload(Video.submitter), selectinload(Video.categories))
        .order_by(Video.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    videos = list(result.scalars().all())

    # Check current user votes
    voted_video_ids = set()
    if current_user:
        video_ids = [v.id for v in videos]
        if video_ids:
            vote_result = await session.execute(
                select(Vote.video_id).where(
                    Vote.user_id == current_user.id,
                    Vote.video_id.in_(video_ids),
                )
            )
            voted_video_ids = {row[0] for row in vote_result}

    return {
        "user": UserBriefResponse.model_validate(user),
        "submitted_videos": [
            video_to_response(v, user_voted=v.id in voted_video_ids) for v in videos
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }
