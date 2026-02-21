from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.video import Video

BADGE_DEFINITIONS = [
    {
        "slug": "first_post",
        "name": "はじめての一歩",
        "description": "最初の動画を投稿した",
    },
    {
        "slug": "good_eye",
        "name": "目利き",
        "description": "投稿した動画が合計10いいねを獲得",
    },
    {
        "slug": "buzz_maker",
        "name": "バズメーカー",
        "description": "投稿した動画が合計100いいねを獲得",
    },
    {
        "slug": "regular",
        "name": "常連",
        "description": "10本以上動画を投稿した",
    },
    {
        "slug": "curator",
        "name": "キュレーター",
        "description": "30本以上動画を投稿した",
    },
    {
        "slug": "trend_hunter",
        "name": "トレンドハンター",
        "description": "トレンド入りする動画を投稿した",
    },
]


async def compute_badges(user_id: str, session: AsyncSession) -> list[dict]:
    video_count = (await session.execute(
        select(func.count()).select_from(Video).where(
            Video.submitted_by == user_id,
            Video.is_active == True,  # noqa: E712
        )
    )).scalar() or 0

    total_votes = (await session.execute(
        select(func.coalesce(func.sum(Video.vote_count), 0)).where(
            Video.submitted_by == user_id,
            Video.is_active == True,  # noqa: E712
        )
    )).scalar() or 0

    has_trending = (await session.execute(
        select(Video.id).where(
            Video.submitted_by == user_id,
            Video.was_trending == True,  # noqa: E712
            Video.is_active == True,  # noqa: E712
        ).limit(1)
    )).scalar_one_or_none() is not None

    earned_map = {
        "first_post": video_count >= 1,
        "good_eye": total_votes >= 10,
        "buzz_maker": total_votes >= 100,
        "regular": video_count >= 10,
        "curator": video_count >= 30,
        "trend_hunter": has_trending,
    }

    return [
        {**badge, "earned": earned_map.get(badge["slug"], False)}
        for badge in BADGE_DEFINITIONS
    ]
