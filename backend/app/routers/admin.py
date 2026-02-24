from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.feedback import Feedback
from app.models.report import Report
from app.models.user import User
from app.models.video import Video
from app.schemas.feedback import FeedbackStatusUpdate
from app.services.auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ReportStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|reviewing|resolved|dismissed)$")


class VideoStatusUpdate(BaseModel):
    is_active: bool


class UserStatusUpdate(BaseModel):
    is_active: bool


@router.get("/reports")
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(Report)

    if status_filter:
        query = query.where(Report.status == status_filter)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Report.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    reports = list(result.scalars().all())

    return {
        "items": [
            {
                "id": r.id,
                "video_id": r.video_id,
                "user_id": r.user_id,
                "reason": r.reason,
                "detail": r.detail,
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in reports
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }


@router.patch("/reports/{report_id}")
async def update_report_status(
    report_id: str,
    body: ReportStatusUpdate,
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Report).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    report.status = body.status
    await session.commit()

    return {
        "id": report.id,
        "status": report.status,
    }


@router.get("/videos")
async def list_videos(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(Video)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    query = query.order_by(Video.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    videos = list(result.scalars().all())

    return {
        "items": [
            {
                "id": v.id,
                "title": v.title,
                "url": v.url,
                "platform": v.platform,
                "is_active": v.is_active,
                "vote_count": v.vote_count,
                "created_at": v.created_at.isoformat(),
            }
            for v in videos
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }


@router.patch("/videos/{video_id}")
async def update_video_status(
    video_id: str,
    body: VideoStatusUpdate,
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Video).where(Video.id == video_id).options(selectinload(Video.tags))
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    was_active = video.is_active
    video.is_active = body.is_active

    # Update tag video_count on activation change
    if was_active and not body.is_active:
        for tag in video.tags:
            tag.video_count = max(0, tag.video_count - 1)
    elif not was_active and body.is_active:
        for tag in video.tags:
            tag.video_count += 1

    await session.commit()

    return {
        "id": video.id,
        "is_active": video.is_active,
    }


# --- Feedbacks ---


@router.get("/feedbacks")
async def list_feedbacks(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(Feedback)
    if status_filter:
        query = query.where(Feedback.status == status_filter)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    query = query.order_by(Feedback.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    feedbacks = list(result.scalars().all())

    return {
        "items": [
            {
                "id": f.id,
                "user_id": f.user_id,
                "category": f.category,
                "body": f.body,
                "status": f.status,
                "created_at": f.created_at.isoformat(),
            }
            for f in feedbacks
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }


@router.patch("/feedbacks/{feedback_id}")
async def update_feedback_status(
    feedback_id: str,
    body: FeedbackStatusUpdate,
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Feedback).where(Feedback.id == feedback_id)
    )
    fb = result.scalar_one_or_none()
    if fb is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    fb.status = body.status
    await session.commit()
    return {"id": fb.id, "status": fb.status}


# --- Users ---


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    q: str | None = Query(None, max_length=100),
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(User)
    if q:
        query = query.where(
            User.display_name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%")
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    users = list(result.scalars().all())

    return {
        "items": [
            {
                "id": u.id,
                "display_name": u.display_name,
                "email": u.email,
                "avatar_url": u.avatar_url,
                "is_active": u.is_active,
                "is_admin": u.is_admin,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_next": (page * per_page) < total,
    }


@router.patch("/users/{user_id}")
async def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身のステータスは変更できません",
        )
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_active = body.is_active
    await session.commit()
    return {"id": user.id, "is_active": user.is_active}


# --- Stats ---


@router.get("/stats")
async def get_stats(
    admin: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    total_users = (await session.execute(
        select(func.count()).select_from(User)
    )).scalar() or 0
    total_videos = (await session.execute(
        select(func.count()).select_from(Video)
    )).scalar() or 0
    pending_reports = (await session.execute(
        select(func.count()).select_from(Report).where(Report.status == "pending")
    )).scalar() or 0
    new_feedbacks = (await session.execute(
        select(func.count()).select_from(Feedback).where(Feedback.status == "new")
    )).scalar() or 0

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "pending_reports": pending_reports,
        "new_feedbacks": new_feedbacks,
    }
