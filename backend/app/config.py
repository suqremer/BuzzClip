import warnings

from pydantic_settings import BaseSettings, SettingsConfigDict

# Allowed frontend origins for redirect validation (OAuth etc.)
_ALLOWED_FRONTEND_ORIGINS = frozenset([
    "https://buzzclip.jp",
    "https://www.buzzclip.jp",
])


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "sqlite+aiosqlite:///./buzzclip.db"
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 15  # short-lived access token
    jwt_refresh_expire_days: int = 30  # long-lived refresh cookie
    frontend_url: str = "http://localhost:3000"
    google_client_id: str = ""
    google_client_secret: str = ""
    backend_url: str = "http://localhost:8000"
    debug: bool = False
    cookie_secure: bool = True  # False for local dev (http)
    cookie_samesite: str = "none"  # "lax" when backend is on same domain (e.g. api.buzzclip.jp)

    @property
    def effective_cookie_secure(self) -> bool:
        """Return False when debug mode is on (local http), True otherwise."""
        if self.debug:
            return False
        return self.cookie_secure

    @property
    def validated_frontend_url(self) -> str:
        """Return frontend_url after whitelist check (production only)."""
        if not self.debug and self.frontend_url not in _ALLOWED_FRONTEND_ORIGINS:
            raise ValueError(
                f"frontend_url '{self.frontend_url}' is not in allowed origins whitelist. "
                f"Allowed: {_ALLOWED_FRONTEND_ORIGINS}"
            )
        return self.frontend_url

    @property
    def cors_origins(self) -> list[str]:
        origins = list(_ALLOWED_FRONTEND_ORIGINS)
        origins.append(self.frontend_url)
        if self.debug:
            origins.append("http://localhost:3000")
        return list(set(origins))


settings = Settings()

# Validate frontend_url at startup (raises in production if not whitelisted).
# Skip validation during tests — they use localhost with debug=False.
import sys
_is_testing = "pytest" in sys.modules or "TESTING" in __import__("os").environ
if not settings.debug and not _is_testing:
    _ = settings.validated_frontend_url

if settings.jwt_secret_key == "dev-secret-key-change-in-production":
    if not settings.debug and not _is_testing:
        raise RuntimeError(
            "JWT_SECRET_KEY must be set in production. "
            "Set a strong secret via environment variable."
        )
    warnings.warn(
        "JWT_SECRET_KEY is using the default dev key. "
        "Set a strong secret in production!",
        stacklevel=1,
    )
