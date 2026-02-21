import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.notification import Notification
from app.models.user import User
from app.models.video import Video
from app.models.vote import Vote
from app.schemas.vote import VoteResponse
from app.services.auth import get_current_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/votes", tags=["votes"])


@router.post("/{video_id}", response_model=VoteResponse)
@limiter.limit("30/minute")
async def upvote(
    request: Request,
    video_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check video exists
    result = await session.execute(
        select(Video).where(Video.id == video_id, Video.is_active == True)  # noqa: E712
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )

    # Check already voted
    result = await session.execute(
        select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.video_id == video_id,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="既にいいね済みです",
        )

    vote = Vote(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        video_id=video_id,
    )
    session.add(vote)
    await session.flush()

    # Update vote_count from actual count
    count = (await session.execute(
        select(func.count()).select_from(Vote).where(Vote.video_id == video_id)
    )).scalar() or 0
    video.vote_count = count

    # Notify video submitter (don't notify self)
    if current_user.id != video.submitted_by:
        session.add(Notification(
            id=str(uuid.uuid4()),
            user_id=video.submitted_by,
            type="vote",
            actor_id=current_user.id,
            video_id=video_id,
        ))

    await session.commit()

    return VoteResponse(
        video_id=video_id,
        new_vote_count=video.vote_count,
        user_voted=True,
    )


@router.delete("/{video_id}", response_model=VoteResponse)
@limiter.limit("30/minute")
async def remove_vote(
    request: Request,
    video_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check video exists
    result = await session.execute(
        select(Video).where(Video.id == video_id, Video.is_active == True)  # noqa: E712
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )

    # Find vote
    result = await session.execute(
        select(Vote).where(
            Vote.user_id == current_user.id,
            Vote.video_id == video_id,
        )
    )
    vote = result.scalar_one_or_none()
    if vote is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="いいねが見つかりません",
        )

    await session.delete(vote)
    await session.flush()

    # Update vote_count from actual count
    count = (await session.execute(
        select(func.count()).select_from(Vote).where(Vote.video_id == video_id)
    )).scalar() or 0
    video.vote_count = count
    await session.commit()

    return VoteResponse(
        video_id=video_id,
        new_vote_count=video.vote_count,
        user_voted=False,
    )
