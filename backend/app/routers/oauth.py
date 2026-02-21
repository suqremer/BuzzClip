import uuid

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.config import Config as StarletteConfig

from app.config import settings
from app.database import get_session
from app.models.user import User
from app.schemas.user import AuthResponse, UserResponse
from app.services.auth import create_access_token

router = APIRouter(prefix="/api/auth", tags=["oauth"])

oauth = OAuth()

if settings.google_client_id:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


@router.get("/google/login")
async def google_login(request: Request):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    redirect_uri = f"{settings.frontend_url}/auth/callback/google"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from Google",
        )

    google_id = userinfo["sub"]
    email = userinfo["email"]
    name = userinfo.get("name", email.split("@")[0])
    avatar = userinfo.get("picture")

    # Check if user already exists with this Google ID
    result = await session.execute(
        select(User).where(User.provider == "google", User.provider_id == google_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        # Check if email already exists (linked to email provider)
        result = await session.execute(select(User).where(User.email == email))
        existing = result.scalar_one_or_none()

        if existing:
            # Link Google to existing email account
            existing.provider = "google"
            existing.provider_id = google_id
            existing.avatar_url = avatar
            await session.commit()
            user = existing
        else:
            # Create new user
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                display_name=name[:50],
                avatar_url=avatar,
                provider="google",
                provider_id=google_id,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

    jwt_token = create_access_token(user.id)
    return AuthResponse(
        access_token=jwt_token,
        user=UserResponse.model_validate(user),
    )
