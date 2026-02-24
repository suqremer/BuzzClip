from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

COOKIE_NAME = "buzzclip_session"
REFRESH_COOKIE_NAME = "buzzclip_refresh"
COOKIE_MAX_AGE = settings.jwt_access_expire_minutes * 60  # seconds
REFRESH_MAX_AGE = settings.jwt_refresh_expire_days * 86400  # seconds


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.jwt_access_expire_minutes)
    payload = {"sub": user_id, "exp": expire, "iat": now, "type": "access"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.jwt_refresh_expire_days)
    payload = {"sub": user_id, "exp": expire, "iat": now, "type": "refresh"}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> str | None:
    """Returns user_id or None if invalid. Only accepts access tokens."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") == "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None


def verify_refresh_token(token: str) -> str | None:
    """Returns user_id only if the token is a valid refresh token."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None


def _cookie_kwargs() -> dict:
    return {
        "httponly": True,
        "secure": settings.effective_cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
    }


def set_auth_cookies(response: Response, user_id: str) -> None:
    """Set access + refresh httpOnly cookies."""
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    kw = _cookie_kwargs()
    response.set_cookie(key=COOKIE_NAME, value=access, max_age=COOKIE_MAX_AGE, **kw)
    response.set_cookie(key=REFRESH_COOKIE_NAME, value=refresh, max_age=REFRESH_MAX_AGE, **kw)


def set_auth_cookie(response: Response, token: str) -> None:
    """Set httpOnly auth cookie on response (access token only, used by OAuth redirect)."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        **_cookie_kwargs(),
    )


def set_refresh_cookie(response: Response, token: str) -> None:
    """Set httpOnly refresh cookie on response."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=REFRESH_MAX_AGE,
        **_cookie_kwargs(),
    )


def clear_auth_cookies(response: Response) -> None:
    """Remove both auth cookies from response."""
    kw = _cookie_kwargs()
    response.delete_cookie(key=COOKIE_NAME, **kw)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, **kw)


def clear_auth_cookie(response: Response) -> None:
    """Remove auth cookie from response (backward compat alias)."""
    clear_auth_cookies(response)


def _extract_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    """Extract JWT from cookie first, then fall back to Bearer header."""
    # 1. Try httpOnly cookie
    cookie_token = request.cookies.get(COOKIE_NAME)
    if cookie_token:
        return cookie_token
    # 2. Fall back to Authorization header (backward compat)
    if credentials:
        return credentials.credentials
    return None


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    """FastAPI dependency to get the current authenticated user."""
    token = _extract_token(request, credentials)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証が必要です",
        )

    user_id = verify_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なトークンです",
        )

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ユーザーが見つかりません",
        )

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """FastAPI dependency to get the current authenticated admin user."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理者権限が必要です",
        )
    return current_user


async def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User | None:
    """FastAPI dependency that returns user if authenticated, None otherwise."""
    token = _extract_token(request, credentials)
    if token is None:
        return None
    user_id = verify_token(token)
    if user_id is None:
        return None
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None
    return user
