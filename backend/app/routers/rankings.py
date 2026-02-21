from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.category import Category
from app.models.user import User
from app.models.video import Video, video_categories
from app.models.vote import Vote
from app.models.vote_snapshot import VoteSnapshot
from app.schemas.video import VideoListResponse
from app.services.auth import get_optional_user
from app.utils.response import video_to_response

router = APIRouter(prefix="/api/rankings", tags=["rankings"])

PERIOD_MAP = {
    "24h": timedelta(hours=24),
    "1w": timedelta(weeks=1),
    "1m": timedelta(days=30),
    "all": None,
}


@router.get("/trending", response_model=VideoListResponse)
async def get_trending(
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    three_hours_ago = now - timedelta(hours=3)

    # Check if we have any snapshots
    snapshot_count = (await session.execute(
        select(func.count()).select_from(VoteSnapshot)
    )).scalar() or 0

    trending_video_ids: list[str] = []
    is_real_trending = False

    if snapshot_count > 0:
        # Get videos that have snapshots in the last 3 hours
        videos_with_snapshots = (await session.execute(
            select(VoteSnapshot.video_id).where(
                VoteSnapshot.snapshot_at >= three_hours_ago
            ).group_by(VoteSnapshot.video_id)
        )).scalars().all()

        for vid in videos_with_snapshots:
            # Latest snapshot vote count
            latest = (await session.execute(
                select(VoteSnapshot.vote_count).where(
                    VoteSnapshot.video_id == vid
                ).order_by(VoteSnapshot.snapshot_at.desc()).limit(1)
            )).scalar()

            # Snapshot closest to 1 hour ago
            one_hour_snapshot = (await session.execute(
                select(VoteSnapshot.vote_count).where(
                    VoteSnapshot.video_id == vid,
                    VoteSnapshot.snapshot_at <= one_hour_ago,
                ).order_by(VoteSnapshot.snapshot_at.desc()).limit(1)
            )).scalar()

            # Snapshot closest to 3 hours ago
            three_hour_snapshot = (await session.execute(
                select(VoteSnapshot.vote_count).where(
                    VoteSnapshot.video_id == vid,
                    VoteSnapshot.snapshot_at <= three_hours_ago,
                ).order_by(VoteSnapshot.snapshot_at.desc()).limit(1)
            )).scalar()

            if latest is None or one_hour_snapshot is None or three_hour_snapshot is None:
                continue

            votes_1h = latest - one_hour_snapshot
            votes_3h = latest - three_hour_snapshot

            # Need at least 2 votes in 3h for meaningful trending
            if votes_3h < 2:
                continue

            # Velocity comparison: 1h velocity > average 3h velocity * 1.5
            avg_3h_velocity = votes_3h / 3.0
            if votes_1h > avg_3h_velocity * 1.5 and votes_1h > 0:
                trending_video_ids.append(vid)

        if trending_video_ids:
            is_real_trending = True

    if not trending_video_ids:
        # Fallback: newest videos with highest votes in 24h
        since_24h = now - timedelta(hours=24)
        fallback_query = (
            select(Video, func.count(Vote.id).label("recent_votes"))
            .outerjoin(Vote, (Vote.video_id == Video.id) & (Vote.created_at >= since_24h))
            .where(Video.is_active == True)  # noqa: E712
            .options(
                selectinload(Video.submitter),
                selectinload(Video.categories),
            )
            .group_by(Video.id)
            .order_by(func.count(Vote.id).desc(), Video.created_at.desc())
            .limit(10)
        )
        result = await session.execute(fallback_query)
        rows = list(result.all())
        videos = [row[0] for row in rows]
    else:
        # Fetch trending videos
        query = (
            select(Video)
            .where(Video.id.in_(trending_video_ids), Video.is_active == True)  # noqa: E712
            .options(
                selectinload(Video.submitter),
                selectinload(Video.categories),
            )
            .order_by(Video.vote_count.desc())
            .limit(10)
        )
        result = await session.execute(query)
        videos = list(result.scalars().all())

    # Check user votes
    voted_video_ids = set()
    if current_user and videos:
        video_ids = [v.id for v in videos]
        vote_result = await session.execute(
            select(Vote.video_id).where(
                Vote.user_id == current_user.id,
                Vote.video_id.in_(video_ids),
            )
        )
        voted_video_ids = {row[0] for row in vote_result}

    items = [
        video_to_response(v, user_voted=v.id in voted_video_ids, is_trending=is_real_trending)
        for v in videos
    ]

    return VideoListResponse(
        items=items,
        total=len(items),
        page=1,
        per_page=10,
        has_next=False,
        trending_count=len(items) if is_real_trending else 0,
    )


@router.get("", response_model=VideoListResponse)
async def get_rankings(
    period: str = Query("24h", pattern="^(24h|1w|1m|all)$"),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    cutoff_delta = PERIOD_MAP.get(period)

    if cutoff_delta is not None:
        # Time-windowed ranking: count votes within period
        since = datetime.utcnow() - cutoff_delta

        query = (
            select(
                Video,
                func.count(Vote.id).label("period_votes"),
            )
            .outerjoin(
                Vote,
                (Vote.video_id == Video.id) & (Vote.created_at >= since),
            )
            .where(Video.is_active == True)  # noqa: E712
            .options(
                selectinload(Video.submitter),
                selectinload(Video.categories),
            )
            .group_by(Video.id)
            .order_by(func.count(Vote.id).desc(), Video.created_at.desc())
        )
    else:
        # All-time: use denormalized vote_count
        query = (
            select(Video, Video.vote_count.label("period_votes"))
            .where(Video.is_active == True)  # noqa: E712
            .options(
                selectinload(Video.submitter),
                selectinload(Video.categories),
            )
            .order_by(Video.vote_count.desc(), Video.created_at.desc())
        )

    # Category filter
    if category:
        query = query.join(video_categories).join(Category).where(
            Category.slug == category
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    rows = list(result.all())
    videos = [row[0] for row in rows]

    # Check user votes
    voted_video_ids = set()
    if current_user and videos:
        video_ids = [v.id for v in videos]
        vote_result = await session.execute(
            select(Vote.video_id).where(
                Vote.user_id == current_user.id,
                Vote.video_id.in_(video_ids),
            )
        )
        voted_video_ids = {row[0] for row in vote_result}

    items = [
        video_to_response(v, user_voted=v.id in voted_video_ids) for v in videos
    ]

    return VideoListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        has_next=(page * per_page) < total,
    )
