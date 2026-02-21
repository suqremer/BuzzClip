import warnings

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "sqlite+aiosqlite:///./buzzclip.db"
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 168  # 7 days
    frontend_url: str = "http://localhost:3000"
    google_client_id: str = ""
    google_client_secret: str = ""
    debug: bool = True

    @property
    def cors_origins(self) -> list[str]:
        origins = [self.frontend_url]
        if self.debug:
            origins.append("http://localhost:3000")
        return list(set(origins))


settings = Settings()

if settings.jwt_secret_key == "dev-secret-key-change-in-production":
    warnings.warn(
        "JWT_SECRET_KEY is using the default dev key. "
        "Set a strong secret in production!",
        stacklevel=1,
    )
