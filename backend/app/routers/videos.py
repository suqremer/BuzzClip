import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.category import Category
from app.models.tag import Tag
from app.models.user import User
from app.models.video import Video, video_categories
from app.models.vote import Vote
from app.schemas.video import (
    VideoListResponse,
    VideoResponse,
    VideoSubmitRequest,
    VideoUpdateRequest,
)
from app.services.auth import get_current_user, get_optional_user
from app.services.oembed import fetch_oembed
from app.utils.limiter import limiter
from app.utils.response import video_to_response
from app.utils.url_validator import validate_video_url

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def submit_video(
    request: Request,
    body: VideoSubmitRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Validate URL
    is_valid, normalized_url, external_id, platform = validate_video_url(body.url)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="有効な動画URLを入力してください（X, YouTube, TikTok）",
        )

    # Check duplicate
    result = await session.execute(
        select(Video).where(Video.url == normalized_url)
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="この動画は既に投稿されています",
        )

    # Fetch oEmbed
    oembed_data = await fetch_oembed(normalized_url, platform)

    # Get categories
    categories = []
    if body.category_slugs:
        result = await session.execute(
            select(Category).where(Category.slug.in_(body.category_slugs[:3]))
        )
        categories = list(result.scalars().all())

    # Parse tags from comment (e.g. "#猫 #おもしろ")
    comment = (body.comment or "")[:200].strip() or None
    tag_names: list[str] = []
    if comment:
        tag_names = list(dict.fromkeys(
            t.lower() for t in re.findall(r"#(\w+)", comment)
            if 1 <= len(t) <= 50
        ))[:5]  # max 5 tags, each 1-50 chars

    # Resolve or create tags
    tags = []
    for name in tag_names:
        result = await session.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(id=str(uuid.uuid4()), name=name)
            session.add(tag)
        tag.video_count = (tag.video_count or 0) + 1
        tags.append(tag)

    video = Video(
        id=str(uuid.uuid4()),
        url=normalized_url,
        external_id=external_id,
        platform=platform,
        author_name=oembed_data.get("author_name") if oembed_data else None,
        author_url=oembed_data.get("author_url") if oembed_data else None,
        oembed_html=oembed_data.get("html") if oembed_data else None,
        title=body.title or (oembed_data.get("title") if oembed_data else None),
        comment=comment,
        submitted_by=current_user.id,
        categories=categories,
        tags=tags,
    )
    session.add(video)
    await session.commit()
    await session.refresh(video, ["submitter", "categories", "tags"])

    return video_to_response(video)


@router.get("", response_model=VideoListResponse)
@limiter.limit("30/minute")
async def list_videos(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    q: str | None = Query(None, max_length=100),
    sort: str = Query("new", pattern="^(new|hot)$"),
    platform: str | None = Query(None),
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(Video).where(Video.is_active == True).options(  # noqa: E712
        selectinload(Video.submitter),
        selectinload(Video.categories),
        selectinload(Video.tags),
    )

    # Platform filter
    if platform:
        platforms = [p.strip() for p in platform.split(",") if p.strip()]
        if platforms:
            query = query.where(Video.platform.in_(platforms))

    # Search filter
    if q:
        search = f"%{q}%"
        query = query.join(User, Video.submitted_by == User.id).where(
            or_(
                Video.title.ilike(search),
                Video.author_name.ilike(search),
                User.display_name.ilike(search),
            )
        )

    # Category filter
    if category:
        query = query.join(video_categories).join(Category).where(
            Category.slug == category
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0

    # Sort
    if sort == "hot":
        query = query.order_by(Video.vote_count.desc(), Video.created_at.desc())
    else:
        query = query.order_by(Video.created_at.desc())

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    videos = list(result.scalars().all())

    # Check user votes
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


@router.get("/sitemap")
async def get_sitemap(session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(Video.id, Video.created_at)
        .where(Video.is_active == True)  # noqa: E712
        .order_by(Video.created_at.desc())
    )
    urls = [{"id": row[0], "created_at": row[1].isoformat()} for row in result]
    return {"urls": urls}


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Video)
        .where(Video.id == video_id, Video.is_active == True)  # noqa: E712
        .options(
            selectinload(Video.submitter),
            selectinload(Video.categories),
            selectinload(Video.tags),
        )
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )

    user_voted = False
    if current_user:
        vote_result = await session.execute(
            select(Vote).where(
                Vote.user_id == current_user.id,
                Vote.video_id == video_id,
            )
        )
        user_voted = vote_result.scalar_one_or_none() is not None

    return video_to_response(video, user_voted=user_voted)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Video).where(Video.id == video_id, Video.is_active == True)  # noqa: E712
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )
    if video.submitted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="自分が投稿した動画のみ削除できます",
        )
    video.is_active = False
    await session.commit()


@router.patch("/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: str,
    body: VideoUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Video)
        .where(Video.id == video_id, Video.is_active == True)  # noqa: E712
        .options(
            selectinload(Video.submitter),
            selectinload(Video.categories),
            selectinload(Video.tags),
        )
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="動画が見つかりません",
        )
    if video.submitted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="自分が投稿した動画のみ編集できます",
        )

    if body.comment is not None:
        video.comment = body.comment.strip()[:200] or None

    if body.category_slugs is not None:
        cats_result = await session.execute(
            select(Category).where(Category.slug.in_(body.category_slugs[:3]))
        )
        video.categories = list(cats_result.scalars().all())

    await session.commit()
    await session.refresh(video, ["submitter", "categories", "tags"])
    return video_to_response(video)
