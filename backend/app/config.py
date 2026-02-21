from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "proxiam"
    postgres_user: str = "proxiam"
    postgres_password: str = "proxiam_dev"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""

    # Meilisearch
    meili_host: str = "http://localhost:7700"
    meili_master_key: str = "proxiam_dev_key"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "proxiam"
    minio_secret_key: str = "proxiam_dev_key"
    minio_bucket: str = "proxiam-docs"

    # Backend
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    backend_cors_origins: str = "http://localhost:5173"

    # AI
    anthropic_api_key: str = ""

    # Clerk Auth
    clerk_domain: str = ""
    clerk_publishable_key: str = ""
    clerk_secret_key: str = ""

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",")]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

# Production safety check
import warnings

if settings.postgres_password == "proxiam_dev":
    warnings.warn(
        "Using default postgres_password — change in production!",
        stacklevel=2,
    )
