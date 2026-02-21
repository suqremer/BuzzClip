import base64
import io
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from PIL import Image
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.category import Category
from app.models.user import User
from app.models.user_hidden_category import UserHiddenCategory
from app.models.user_mute import UserMute
from app.models.video import Video
from app.models.vote import Vote
from app.schemas.user import AuthResponse, LoginRequest, SignupRequest, UserBriefResponse, UserResponse, UserUpdateRequest
from app.services.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.utils.limiter import limiter
from app.utils.response import video_to_response

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(
    request: Request,
    body: SignupRequest,
    session: AsyncSession = Depends(get_session),
):
    # Check if email already exists
    result = await session.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このメールアドレスは既に登録されています",
        )

    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        display_name=body.display_name.strip(),
        password_hash=hash_password(body.password),
        provider="email",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    current_user.display_name = body.display_name.strip()
    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)


AVATAR_MAX_SIZE = 2 * 1024 * 1024  # 2MB
AVATAR_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
AVATAR_DIMENSION = 200


def _process_avatar(data: bytes) -> str:
    """Resize image to 200x200 center crop, return as data URL."""
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")

    # Center crop to square
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))

    # Resize
    img = img.resize((AVATAR_DIMENSION, AVATAR_DIMENSION), Image.LANCZOS)

    # Encode as JPEG
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/jpeg;base64,{b64}"


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if file.content_type not in AVATAR_ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JPEG、PNG、WebP のみアップロードできます",
        )

    data = await file.read()
    if len(data) > AVATAR_MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイルサイズは2MB以下にしてください",
        )

    try:
        current_user.avatar_url = _process_avatar(data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="画像の処理に失敗しました",
        )

    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.delete("/me/avatar", response_model=UserResponse)
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    current_user.avatar_url = None
    await session.commit()
    await session.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Get submitted videos
    result = await session.execute(
        select(Video)
        .where(Video.submitted_by == current_user.id, Video.is_active == True)  # noqa: E712
        .options(selectinload(Video.submitter), selectinload(Video.categories), selectinload(Video.tags))
        .order_by(Video.created_at.desc())
    )
    submitted_videos = list(result.scalars().all())

    # Get voted videos
    result = await session.execute(
        select(Video)
        .join(Vote, Vote.video_id == Video.id)
        .where(Vote.user_id == current_user.id, Video.is_active == True)  # noqa: E712
        .options(selectinload(Video.submitter), selectinload(Video.categories), selectinload(Video.tags))
        .order_by(Video.created_at.desc())
    )
    voted_videos = list(result.scalars().all())

    # For voted videos, user_voted is always True
    voted_ids = {v.id for v in voted_videos}

    return {
        "user": UserResponse.model_validate(current_user),
        "submitted_videos": [
            video_to_response(v, user_voted=v.id in voted_ids) for v in submitted_videos
        ],
        "voted_videos": [
            video_to_response(v, user_voted=True) for v in voted_videos
        ],
    }


# --- Hidden Categories ---


@router.get("/me/hidden-categories")
async def get_hidden_categories(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Category.slug)
        .join(UserHiddenCategory, UserHiddenCategory.category_id == Category.id)
        .where(UserHiddenCategory.user_id == current_user.id)
    )
    return {"hidden_category_slugs": [row[0] for row in result]}


class HiddenCategoriesRequest(BaseModel):
    category_slugs: list[str]


@router.put("/me/hidden-categories")
async def update_hidden_categories(
    body: HiddenCategoriesRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Lookup category IDs from slugs
    if body.category_slugs:
        result = await session.execute(
            select(Category.id, Category.slug).where(Category.slug.in_(body.category_slugs))
        )
        slug_to_id = {row[1]: row[0] for row in result}
    else:
        slug_to_id = {}

    # Replace all hidden categories
    await session.execute(
        delete(UserHiddenCategory).where(
            UserHiddenCategory.user_id == current_user.id
        )
    )
    for slug, cat_id in slug_to_id.items():
        session.add(UserHiddenCategory(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            category_id=cat_id,
        ))
    await session.commit()

    return {"hidden_category_slugs": list(slug_to_id.keys())}


# --- User Mutes ---


@router.get("/me/mutes")
async def get_muted_users(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(UserMute).where(
            UserMute.user_id == current_user.id
        ).options(selectinload(UserMute.muted_user))
    )
    mutes = list(result.scalars().all())
    return {
        "muted_users": [
            {
                "id": m.muted_user.id,
                "display_name": m.muted_user.display_name,
                "avatar_url": m.muted_user.avatar_url,
            }
            for m in mutes if m.muted_user
        ]
    }


@router.post("/me/mutes/{user_id}", status_code=status.HTTP_201_CREATED)
async def mute_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身をミュートすることはできません",
        )

    # Check target user exists
    target = await session.execute(
        select(User).where(User.id == user_id, User.is_active == True)  # noqa: E712
    )
    if target.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません",
        )

    # Check if already muted
    existing = await session.execute(
        select(UserMute).where(
            UserMute.user_id == current_user.id,
            UserMute.muted_user_id == user_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return {"status": "already_muted"}

    session.add(UserMute(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        muted_user_id=user_id,
    ))
    await session.commit()
    return {"status": "muted"}


@router.delete("/me/mutes/{user_id}")
async def unmute_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        delete(UserMute).where(
            UserMute.user_id == current_user.id,
            UserMute.muted_user_id == user_id,
        )
    )
    await session.commit()
    return {"status": "unmuted"}


@router.get("/me/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all user preferences in one call (hidden categories + muted users)."""
    # Hidden categories (return slugs)
    hidden_result = await session.execute(
        select(Category.slug)
        .join(UserHiddenCategory, UserHiddenCategory.category_id == Category.id)
        .where(UserHiddenCategory.user_id == current_user.id)
    )
    hidden_category_slugs = [row[0] for row in hidden_result]

    # Muted users
    mute_result = await session.execute(
        select(UserMute.muted_user_id).where(
            UserMute.user_id == current_user.id
        )
    )
    muted_user_ids = [row[0] for row in mute_result]

    return {
        "hidden_category_slugs": hidden_category_slugs,
        "muted_user_ids": muted_user_ids,
    }
