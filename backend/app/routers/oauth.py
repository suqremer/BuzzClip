import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.user import User
from app.services.auth import create_access_token, create_refresh_token, set_auth_cookie, set_refresh_cookie

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["oauth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _google_configured() -> bool:
    return bool(settings.google_client_id and settings.google_client_secret)


def _redirect_uri() -> str:
    # Use frontend URL so the callback goes through the Next.js proxy.
    # This ensures cookies are set on the frontend domain (first-party),
    # avoiding Safari ITP / third-party cookie blocking.
    return f"{settings.frontend_url}/api/auth/google/callback"


def _create_state_token() -> str:
    """Create a signed JWT to use as OAuth state (CSRF protection).

    Completely stateless: no cookies, no sessions, no database.
    The JWT signature proves it came from our server.
    """
    payload = {
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _verify_state_token(state: str) -> bool:
    """Verify the signed JWT state token."""
    try:
        jwt.decode(state, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return True
    except JWTError:
        return False


@router.get("/google/login")
async def google_login():
    if not _google_configured():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    state = _create_state_token()

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": _redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }

    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


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

    # Check for Google-returned errors
    error = request.query_params.get("error")
    if error:
        error_desc = request.query_params.get("error_description", "")
        logger.error("Google returned error: %s - %s", error, error_desc)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=google_denied"
        )

    code = request.query_params.get("code")
    state = request.query_params.get("state")

    if not code:
        logger.error("No authorization code in callback")
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=no_code"
        )

    # Verify state (JWT signature + expiration)
    if not state or not _verify_state_token(state):
        logger.error("Invalid state token")
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=invalid_state"
        )

    # Exchange authorization code for tokens
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
            logger.error(
                "Token exchange failed (%s): %s",
                token_resp.status_code,
                token_resp.text,
            )
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=token_failed"
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            logger.error("No access_token in token response")
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=token_failed"
            )
    except Exception as e:
        logger.error("Token exchange exception: %s", e, exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=token_failed"
        )

    # Get user info from Google
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if userinfo_resp.status_code != 200:
            logger.error("Userinfo failed (%s)", userinfo_resp.status_code)
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
            )

        userinfo = userinfo_resp.json()
    except Exception as e:
        logger.error("Userinfo exception: %s", e, exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
        )

    google_id = userinfo.get("sub")
    email = userinfo.get("email")
    email_verified = userinfo.get("email_verified", False)

    if not google_id or not email or not email_verified:
        if not email_verified:
            logger.error("Email not verified for google_id=%s", google_id)
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=email_not_verified"
            )
        logger.error("Missing user info: sub=%s, email=%s", google_id, email)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=incomplete_profile"
        )

    name = userinfo.get("name", email.split("@")[0])
    avatar = userinfo.get("picture")

    # Find or create user
    try:
        result = await session.execute(
            select(User).where(
                User.provider == "google", User.provider_id == google_id
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            result = await session.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()

            if existing:
                # If user signed up with email/password, don't auto-merge
                # to prevent account takeover
                if existing.provider == "email" and existing.password_hash:
                    logger.warning(
                        "OAuth login blocked: email %s already registered via email/password",
                        email,
                    )
                    return RedirectResponse(
                        f"{settings.frontend_url}/auth/callback/google"
                        f"?error=email_exists"
                    )
                existing.provider = "google"
                existing.provider_id = google_id
                existing.avatar_url = avatar
                await session.commit()
                user = existing
            else:
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
        refresh_token = create_refresh_token(user.id)
        redirect = RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?auth=success"
        )
        set_auth_cookie(redirect, jwt_token)
        set_refresh_cookie(redirect, refresh_token)
        return redirect
    except IntegrityError as e:
        await session.rollback()
        logger.error("Integrity error during OAuth: %s", e)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=email_exists"
        )
    except Exception as e:
        await session.rollback()
        logger.error("DB error during user creation: %s", e, exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=db_error"
        )
