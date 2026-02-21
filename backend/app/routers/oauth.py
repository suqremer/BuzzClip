import logging
import secrets
import uuid
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.user import User
from app.services.auth import create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _google_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def _redirect_uri() -> str:
    return f"{settings.backend_url}/api/auth/google/callback"


@router.get("/google/login")
async def google_login(request: Request):
    if not _google_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }

    response = RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")
    response.set_cookie(
        "_oauth_state",
        state,
        max_age=600,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
    )
    return response


@router.get("/google/callback")
async def google_callback(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    if not _google_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    error = request.query_params.get("error")
    if error:
        logger.error(f"Google returned error: {error}")
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=google_denied"
        )

    code = request.query_params.get("code")
    state = request.query_params.get("state")
    stored_state = request.cookies.get("_oauth_state")

    if not code or not state or state != stored_state:
        logger.error(f"State mismatch: got={state}, stored={stored_state}")
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=invalid_state"
        )

    # Exchange authorization code for tokens
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "redirect_uri": _redirect_uri(),
                    "grant_type": "authorization_code",
                },
            )

        if token_resp.status_code != 200:
            logger.error(f"Token exchange failed: {token_resp.status_code} {token_resp.text}")
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=token_exchange_failed"
            )

        token_data = token_resp.json()
    except Exception as e:
        logger.error(f"Token exchange error: {e}", exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=token_exchange_failed"
        )

    # Get user info from Google
    try:
        async with httpx.AsyncClient() as client:
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )

        if userinfo_resp.status_code != 200:
            logger.error(f"Userinfo fetch failed: {userinfo_resp.status_code}")
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
            )

        userinfo = userinfo_resp.json()
    except Exception as e:
        logger.error(f"Userinfo fetch error: {e}", exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
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

    # Redirect to frontend with token (clear the state cookie)
    params = urlencode({"token": jwt_token})
    response = RedirectResponse(f"{settings.frontend_url}/auth/callback/google?{params}")
    response.delete_cookie("_oauth_state")
    return response
