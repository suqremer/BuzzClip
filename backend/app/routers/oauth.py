import logging
import secrets
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.requests import Request
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
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


def _create_state_token() -> str:
    """Create a signed JWT to use as OAuth state (CSRF protection).

    Completely stateless: no cookies, no sessions, no database.
    The JWT signature proves it came from our server.
    """
    payload = {
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.utcnow() + timedelta(minutes=10),
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
        logger.error(f"Google returned error: {error} - {error_desc}")
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=google_denied"
            f"&detail={error}"
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
        logger.error(f"Invalid state token: {state[:20] if state else 'None'}...")
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
            error_body = token_resp.text
            logger.error(
                f"Token exchange failed ({token_resp.status_code}): {error_body}"
            )
            # Extract Google's error description for debugging
            try:
                err_json = token_resp.json()
                err_detail = err_json.get("error_description", err_json.get("error", ""))
            except Exception:
                err_detail = f"status_{token_resp.status_code}"
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=token_failed"
                f"&detail={err_detail}"
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            logger.error(f"No access_token in response: {token_data}")
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=token_failed"
                f"&detail=no_access_token"
            )
    except Exception as e:
        logger.error(f"Token exchange exception: {e}", exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=token_failed"
            f"&detail=exception"
        )

    # Get user info from Google
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if userinfo_resp.status_code != 200:
            logger.error(f"Userinfo failed ({userinfo_resp.status_code})")
            return RedirectResponse(
                f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
            )

        userinfo = userinfo_resp.json()
    except Exception as e:
        logger.error(f"Userinfo exception: {e}", exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=userinfo_failed"
        )

    google_id = userinfo.get("sub")
    email = userinfo.get("email")

    if not google_id or not email:
        logger.error(f"Missing user info: sub={google_id}, email={email}")
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
        params = urlencode({"token": jwt_token})
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?{params}"
        )
    except Exception as e:
        logger.error(f"DB error during user creation: {e}", exc_info=True)
        return RedirectResponse(
            f"{settings.frontend_url}/auth/callback/google?error=db_error"
        )


@router.get("/google/debug")
async def google_debug():
    """Diagnostic endpoint to verify OAuth configuration and test Google API."""
    # Test: call Google token endpoint with dummy code to check credentials
    cred_test = "not_tested"
    google_error_detail = ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": "dummy_test_code",
                    "redirect_uri": _redirect_uri(),
                    "grant_type": "authorization_code",
                },
            )
            google_error_detail = resp.text
            if resp.status_code == 400:
                err = resp.json().get("error", "")
                if err == "invalid_grant":
                    cred_test = "credentials_ok"
                elif err == "invalid_client":
                    cred_test = "credentials_wrong"
                else:
                    cred_test = f"error_{err}"
            else:
                cred_test = f"unexpected_status_{resp.status_code}"
    except Exception as e:
        cred_test = f"exception: {e}"

    return {
        "google_configured": _google_configured(),
        "client_id_length": len(settings.google_client_id),
        "client_id_prefix": settings.google_client_id[:20] + "..."
        if settings.google_client_id
        else "",
        "client_secret_length": len(settings.google_client_secret),
        "client_secret_prefix": settings.google_client_secret[:10] + "..."
        if settings.google_client_secret
        else "",
        "redirect_uri": _redirect_uri(),
        "frontend_url": settings.frontend_url,
        "backend_url": settings.backend_url,
        "debug_mode": settings.debug,
        "credential_test": cred_test,
        "google_raw_response": google_error_detail[:500],
    }
