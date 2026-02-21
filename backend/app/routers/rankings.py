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
from app.schemas.user import UserBriefResponse
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
    platform: str | None = Query(None),
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

        if videos_with_snapshots:
            # Batch query: latest snapshot per video (3 queries total instead of 3N)
            def _ranked_snapshot_subq(filter_clause=None):
                q = select(
                    VoteSnapshot.video_id,
                    VoteSnapshot.vote_count,
                    func.row_number().over(
                        partition_by=VoteSnapshot.video_id,
                        order_by=VoteSnapshot.snapshot_at.desc(),
                    ).label("rn"),
                ).where(VoteSnapshot.video_id.in_(videos_with_snapshots))
                if filter_clause is not None:
                    q = q.where(filter_clause)
                return q.subquery()

            latest_sq = _ranked_snapshot_subq()
            latest_rows = (await session.execute(
                select(latest_sq.c.video_id, latest_sq.c.vote_count).where(latest_sq.c.rn == 1)
            )).all()
            latest_map = {r[0]: r[1] for r in latest_rows}

            one_hour_sq = _ranked_snapshot_subq(VoteSnapshot.snapshot_at <= one_hour_ago)
            one_hour_rows = (await session.execute(
                select(one_hour_sq.c.video_id, one_hour_sq.c.vote_count).where(one_hour_sq.c.rn == 1)
            )).all()
            one_hour_map = {r[0]: r[1] for r in one_hour_rows}

            three_hour_sq = _ranked_snapshot_subq(VoteSnapshot.snapshot_at <= three_hours_ago)
            three_hour_rows = (await session.execute(
                select(three_hour_sq.c.video_id, three_hour_sq.c.vote_count).where(three_hour_sq.c.rn == 1)
            )).all()
            three_hour_map = {r[0]: r[1] for r in three_hour_rows}

            for vid in videos_with_snapshots:
                latest = latest_map.get(vid)
                one_hour_val = one_hour_map.get(vid)
                three_hour_val = three_hour_map.get(vid)

                if latest is None or one_hour_val is None or three_hour_val is None:
                    continue

                votes_1h = latest - one_hour_val
                votes_3h = latest - three_hour_val

                if votes_3h < 2:
                    continue

                avg_3h_velocity = votes_3h / 3.0
                if votes_1h > avg_3h_velocity * 1.5 and votes_1h > 0:
                    trending_video_ids.append(vid)

        if trending_video_ids:
            is_real_trending = True
            # Mark videos as was_trending
            trending_vids = await session.execute(
                select(Video).where(Video.id.in_(trending_video_ids))
            )
            for tv in trending_vids.scalars().all():
                if not tv.was_trending:
                    tv.was_trending = True
            await session.commit()

    # Parse platform filter
    platform_list = [p.strip() for p in platform.split(",") if p.strip()] if platform else []

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
                selectinload(Video.tags),
            )
            .group_by(Video.id)
            .order_by(func.count(Vote.id).desc(), Video.created_at.desc())
            .limit(10)
        )
        if platform_list:
            fallback_query = fallback_query.where(Video.platform.in_(platform_list))
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
                selectinload(Video.tags),
            )
            .order_by(Video.vote_count.desc())
            .limit(10)
        )
        if platform_list:
            query = query.where(Video.platform.in_(platform_list))
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
    platform: str | None = Query(None),
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
                selectinload(Video.tags),
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
                selectinload(Video.tags),
            )
            .order_by(Video.vote_count.desc(), Video.created_at.desc())
        )

    # Platform filter
    if platform:
        platforms = [p.strip() for p in platform.split(",") if p.strip()]
        if platforms:
            query = query.where(Video.platform.in_(platforms))

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


@router.get("/contributors")
async def get_contributor_ranking(
    session: AsyncSession = Depends(get_session),
):
    now = datetime.utcnow()
    week_ago = now - timedelta(weeks=1)

    query = (
        select(
            Video.submitted_by,
            func.count(Vote.id).label("weekly_votes"),
        )
        .join(Vote, (Vote.video_id == Video.id) & (Vote.created_at >= week_ago))
        .where(Video.is_active == True)  # noqa: E712
        .group_by(Video.submitted_by)
        .order_by(func.count(Vote.id).desc())
        .limit(10)
    )
    result = await session.execute(query)
    rows = list(result.all())

    user_ids = [row[0] for row in rows]
    users_map = {}
    if user_ids:
        users_result = await session.execute(
            select(User).where(User.id.in_(user_ids), User.is_active == True)  # noqa: E712
        )
        users_map = {u.id: u for u in users_result.scalars().all()}

    contributors = []
    for rank, (user_id, weekly_votes) in enumerate(rows, 1):
        user = users_map.get(user_id)
        if user:
            contributors.append({
                "rank": rank,
                "user": UserBriefResponse.model_validate(user),
                "vote_count": weekly_votes,
            })

    return {"contributors": contributors, "period": "1w"}
