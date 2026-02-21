import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_session
from app.models.user import User
from app.models.video import Video
from app.models.vote import Vote
from app.schemas.user import AuthResponse, LoginRequest, SignupRequest, UserResponse, UserUpdateRequest
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


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Get submitted videos
    result = await session.execute(
        select(Video)
        .where(Video.submitted_by == current_user.id, Video.is_active == True)  # noqa: E712
        .options(selectinload(Video.submitter), selectinload(Video.categories))
        .order_by(Video.created_at.desc())
    )
    submitted_videos = list(result.scalars().all())

    # Get voted videos
    result = await session.execute(
        select(Video)
        .join(Vote, Vote.video_id == Video.id)
        .where(Vote.user_id == current_user.id, Video.is_active == True)  # noqa: E712
        .options(selectinload(Video.submitter), selectinload(Video.categories))
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
