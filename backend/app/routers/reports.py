from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.report import Report
from app.models.user import User
from app.models.video import Video
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])

VALID_REASONS = ["spam", "inappropriate", "copyright", "misleading", "other"]


class ReportRequest(BaseModel):
    video_id: str
    reason: str = Field(pattern="^(spam|inappropriate|copyright|misleading|other)$")
    detail: str | None = Field(None, max_length=500)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_report(
    body: ReportRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check video exists
    result = await session.execute(
        select(Video).where(Video.id == body.video_id, Video.is_active == True)  # noqa: E712
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )

    # Check duplicate report
    result = await session.execute(
        select(Report).where(
            Report.video_id == body.video_id,
            Report.user_id == current_user.id,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="既にこの動画を通報済みです",
        )

    report = Report(
        video_id=body.video_id,
        user_id=current_user.id,
        reason=body.reason,
        detail=body.detail,
    )
    session.add(report)
    await session.commit()

    return {"message": "通報を受け付けました"}
