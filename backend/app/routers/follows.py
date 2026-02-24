import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.notification import Notification
from app.models.user import User
from app.models.user_follow import UserFollow
from app.schemas.follow import FollowActionResponse, FollowCountsResponse, FollowListResponse, FollowStatusResponse
from app.schemas.user import UserBriefResponse
from app.services.auth import get_current_user, get_optional_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/follows", tags=["follows"])


@router.post("/{user_id}", response_model=FollowActionResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身をフォローすることはできません",
        )

    # Check target exists
    target = await session.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    if target.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    # Check if already following
    existing = await session.execute(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return FollowActionResponse(status="already_following")

    session.add(UserFollow(
        id=str(uuid.uuid4()),
        follower_id=current_user.id,
        following_id=user_id,
    ))
    # Notify the followed user
    session.add(Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type="follow",
        actor_id=current_user.id,
    ))
    await session.commit()
    return FollowActionResponse(status="followed")


@router.delete("/{user_id}", response_model=FollowActionResponse)
async def unfollow_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy import delete
    await session.execute(
        delete(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    await session.commit()
    return FollowActionResponse(status="unfollowed")


@router.get("/{user_id}/counts", response_model=FollowCountsResponse)
@limiter.limit("30/minute")
async def get_follow_counts(
    request: Request,
    user_id: str,
    session: AsyncSession = Depends(get_session),
):
    followers = (await session.execute(
        select(func.count()).select_from(UserFollow).where(UserFollow.following_id == user_id)
    )).scalar() or 0
    following = (await session.execute(
        select(func.count()).select_from(UserFollow).where(UserFollow.follower_id == user_id)
    )).scalar() or 0
    return FollowCountsResponse(followers_count=followers, following_count=following)


@router.get("/{user_id}/status", response_model=FollowStatusResponse)
async def get_follow_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == user_id,
        )
    )
    return {"is_following": result.scalar_one_or_none() is not None}


@router.get("/{user_id}/followers", response_model=FollowListResponse)
@limiter.limit("20/minute")
async def get_followers(
    request: Request,
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    base = select(UserFollow).where(UserFollow.following_id == user_id)
    total = (await session.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar() or 0

    result = await session.execute(
        base.options(selectinload(UserFollow.follower_user))
        .order_by(UserFollow.created_at.desc())
        .offset((page - 1) * per_page).limit(per_page)
    )
    follows = list(result.scalars().all())
    users = [UserBriefResponse.model_validate(f.follower_user) for f in follows if f.follower_user]
    return FollowListResponse(
        users=users, total=total, page=page, per_page=per_page,
        has_next=(page * per_page) < total,
    )


@router.get("/{user_id}/following", response_model=FollowListResponse)
@limiter.limit("20/minute")
async def get_following(
    request: Request,
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    base = select(UserFollow).where(UserFollow.follower_id == user_id)
    total = (await session.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar() or 0

    result = await session.execute(
        base.options(selectinload(UserFollow.following_user))
        .order_by(UserFollow.created_at.desc())
        .offset((page - 1) * per_page).limit(per_page)
    )
    follows = list(result.scalars().all())
    users = [UserBriefResponse.model_validate(f.following_user) for f in follows if f.following_user]
    return FollowListResponse(
        users=users, total=total, page=page, per_page=per_page,
        has_next=(page * per_page) < total,
    )
