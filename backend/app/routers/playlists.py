import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.playlist import Playlist
from app.models.playlist_video import PlaylistVideo
from app.models.user import User
from app.models.video import Video
from app.models.vote import Vote
from app.schemas.playlist import (
    PlaylistBriefResponse,
    PlaylistCreateRequest,
    PlaylistDetailResponse,
    PlaylistListResponse,
    PlaylistUpdateRequest,
    PlaylistVideoRequest,
)
from app.schemas.user import UserBriefResponse
from app.services.auth import get_current_user, get_optional_user
from app.utils.response import video_to_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/playlists", tags=["playlists"])

DEFAULT_PLAYLIST_NAME = "お気に入り"
MAX_PLAYLISTS_PER_USER = 10
MAX_VIDEOS_PER_PLAYLIST = 100


@router.get("", response_model=PlaylistListResponse)
async def list_my_playlists(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Auto-create default playlist if user has none
    count = (await session.execute(
        select(func.count()).select_from(Playlist).where(Playlist.user_id == current_user.id)
    )).scalar() or 0

    if count == 0:
        try:
            default = Playlist(
                id=str(uuid.uuid4()),
                user_id=current_user.id,
                name=DEFAULT_PLAYLIST_NAME,
                is_public=False,
            )
            session.add(default)
            await session.commit()
        except IntegrityError:
            # Concurrent request already created the default playlist
            await session.rollback()
            logger.debug("Default playlist already created by concurrent request for user %s", current_user.id)

    # Fetch playlists with video counts
    result = await session.execute(
        select(
            Playlist,
            func.count(PlaylistVideo.id).label("video_count"),
        )
        .outerjoin(PlaylistVideo, PlaylistVideo.playlist_id == Playlist.id)
        .where(Playlist.user_id == current_user.id)
        .group_by(Playlist.id)
        .order_by(Playlist.created_at.asc())
    )
    rows = list(result.all())
    playlists = [
        PlaylistBriefResponse(
            id=pl.id, name=pl.name, is_public=pl.is_public,
            video_count=vc, created_at=pl.created_at,
        )
        for pl, vc in rows
    ]
    return PlaylistListResponse(playlists=playlists)


@router.post("", response_model=PlaylistBriefResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    body: PlaylistCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    count = (await session.execute(
        select(func.count()).select_from(Playlist).where(Playlist.user_id == current_user.id)
    )).scalar() or 0

    if count >= MAX_PLAYLISTS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"プレイリストは最大{MAX_PLAYLISTS_PER_USER}個までです",
        )

    # Check duplicate name
    existing = await session.execute(
        select(Playlist).where(
            Playlist.user_id == current_user.id,
            Playlist.name == body.name,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="同じ名前のプレイリストが既にあります",
        )

    playlist = Playlist(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=body.name,
        is_public=body.is_public,
    )
    session.add(playlist)
    await session.commit()
    return PlaylistBriefResponse(
        id=playlist.id, name=playlist.name, is_public=playlist.is_public,
        video_count=0, created_at=playlist.created_at,
    )


@router.get("/video/{video_id}")
async def get_playlists_containing_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(PlaylistVideo.playlist_id)
        .join(Playlist, Playlist.id == PlaylistVideo.playlist_id)
        .where(
            Playlist.user_id == current_user.id,
            PlaylistVideo.video_id == video_id,
        )
    )
    return {"playlist_ids": [row[0] for row in result]}


@router.get("/{playlist_id}", response_model=PlaylistDetailResponse)
async def get_playlist(
    playlist_id: str,
    current_user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Playlist)
        .where(Playlist.id == playlist_id)
        .options(selectinload(Playlist.owner))
    )
    playlist = result.scalar_one_or_none()
    if playlist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    if not playlist.is_public:
        if current_user is None or current_user.id != playlist.user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    # Fetch videos
    pv_result = await session.execute(
        select(PlaylistVideo)
        .where(PlaylistVideo.playlist_id == playlist_id)
        .options(
            selectinload(PlaylistVideo.video).selectinload(Video.submitter),
            selectinload(PlaylistVideo.video).selectinload(Video.categories),
            selectinload(PlaylistVideo.video).selectinload(Video.tags),
        )
        .order_by(PlaylistVideo.position.asc())
    )
    pvs = list(pv_result.scalars().all())
    videos = [pv.video for pv in pvs if pv.video and pv.video.is_active]

    # Check user votes
    voted_ids = set()
    if current_user and videos:
        video_ids = [v.id for v in videos]
        vote_result = await session.execute(
            select(Vote.video_id).where(
                Vote.user_id == current_user.id,
                Vote.video_id.in_(video_ids),
            )
        )
        voted_ids = {row[0] for row in vote_result}

    return PlaylistDetailResponse(
        id=playlist.id,
        name=playlist.name,
        is_public=playlist.is_public,
        owner=UserBriefResponse.model_validate(playlist.owner),
        videos=[video_to_response(v, user_voted=v.id in voted_ids) for v in videos],
        created_at=playlist.created_at,
    )


@router.patch("/{playlist_id}", response_model=PlaylistBriefResponse)
async def update_playlist(
    playlist_id: str,
    body: PlaylistUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
    )
    playlist = result.scalar_one_or_none()
    if playlist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    if body.name is not None:
        playlist.name = body.name
    if body.is_public is not None:
        playlist.is_public = body.is_public
    await session.commit()

    vc = (await session.execute(
        select(func.count()).select_from(PlaylistVideo).where(PlaylistVideo.playlist_id == playlist_id)
    )).scalar() or 0

    return PlaylistBriefResponse(
        id=playlist.id, name=playlist.name, is_public=playlist.is_public,
        video_count=vc, created_at=playlist.created_at,
    )


@router.delete("/{playlist_id}")
async def delete_playlist(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
    )
    playlist = result.scalar_one_or_none()
    if playlist is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    await session.delete(playlist)
    await session.commit()
    return {"status": "deleted"}


@router.post("/{playlist_id}/videos", status_code=status.HTTP_201_CREATED)
async def add_video_to_playlist(
    playlist_id: str,
    body: PlaylistVideoRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    # Check video count
    vc = (await session.execute(
        select(func.count()).select_from(PlaylistVideo).where(PlaylistVideo.playlist_id == playlist_id)
    )).scalar() or 0
    if vc >= MAX_VIDEOS_PER_PLAYLIST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"1つのプレイリストに追加できる動画は最大{MAX_VIDEOS_PER_PLAYLIST}本です",
        )

    # Check video exists
    video = await session.execute(
        select(Video).where(Video.id == body.video_id, Video.is_active == True)  # noqa: E712
    )
    if video.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="動画が見つかりません")

    # Check duplicate
    dup = await session.execute(
        select(PlaylistVideo).where(
            PlaylistVideo.playlist_id == playlist_id,
            PlaylistVideo.video_id == body.video_id,
        )
    )
    if dup.scalar_one_or_none() is not None:
        return {"status": "already_added"}

    # Get max position
    max_pos = (await session.execute(
        select(func.coalesce(func.max(PlaylistVideo.position), 0))
        .where(PlaylistVideo.playlist_id == playlist_id)
    )).scalar() or 0

    session.add(PlaylistVideo(
        id=str(uuid.uuid4()),
        playlist_id=playlist_id,
        video_id=body.video_id,
        position=max_pos + 1,
    ))
    await session.commit()
    return {"status": "added"}


@router.delete("/{playlist_id}/videos/{video_id}")
async def remove_video_from_playlist(
    playlist_id: str,
    video_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Playlist).where(Playlist.id == playlist_id, Playlist.user_id == current_user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="プレイリストが見つかりません")

    from sqlalchemy import delete
    await session.execute(
        delete(PlaylistVideo).where(
            PlaylistVideo.playlist_id == playlist_id,
            PlaylistVideo.video_id == video_id,
        )
    )
    await session.commit()
    return {"status": "removed"}
