from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import StatusResponse
from app.schemas.notification import (
    MarkReadRequest,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.schemas.user import UserBriefResponse
from app.services.auth import get_current_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
@limiter.limit("30/minute")
async def list_notifications(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    base_query = select(Notification).where(Notification.user_id == current_user.id)

    total = (await session.execute(
        select(func.count()).select_from(base_query.subquery())
    )).scalar() or 0

    query = (
        base_query
        .options(selectinload(Notification.actor), selectinload(Notification.video))
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await session.execute(query)
    notifications = list(result.scalars().all())

    items = []
    for n in notifications:
        items.append(NotificationResponse(
            id=n.id,
            type=n.type,
            actor=UserBriefResponse.model_validate(n.actor),
            video_id=n.video_id,
            video_title=n.video.title if n.video else None,
            is_read=n.is_read,
            created_at=n.created_at,
        ))

    return NotificationListResponse(
        items=items, total=total, page=page, per_page=per_page,
        has_next=(page * per_page) < total,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
@limiter.limit("30/minute")
async def get_unread_count(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    count = (await session.execute(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    )).scalar() or 0
    return UnreadCountResponse(count=count)


@router.post("/mark-read", response_model=StatusResponse)
async def mark_read(
    body: MarkReadRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if body.notification_ids:
        await session.execute(
            update(Notification)
            .where(
                Notification.user_id == current_user.id,
                Notification.id.in_(body.notification_ids),
            )
            .values(is_read=True)
        )
    else:
        await session.execute(
            update(Notification)
            .where(Notification.user_id == current_user.id)
            .values(is_read=True)
        )
    await session.commit()
    return {"status": "ok"}
