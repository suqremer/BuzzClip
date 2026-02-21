from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.category import Category
from app.models.video import Video, video_categories
from app.schemas.video import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(
            Category,
            func.count(video_categories.c.video_id).label("video_count"),
        )
        .outerjoin(video_categories, Category.id == video_categories.c.category_id)
        .outerjoin(
            Video,
            (Video.id == video_categories.c.video_id) & (Video.is_active == True),  # noqa: E712
        )
        .where(Category.is_active == True)  # noqa: E712
        .group_by(Category.id)
        .order_by(Category.sort_order)
    )

    items = []
    for row in result:
        cat = row[0]
        count = row[1]
        items.append(
            CategoryResponse(
                id=cat.id,
                slug=cat.slug,
                name_ja=cat.name_ja,
                icon=cat.icon,
                video_count=count,
            )
        )

    return items
