from functools import lru_cache

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class Settings(BaseSettings):
    database_url: str
    app_env: str = "development"

    # Public portfolio protection
    public_portfolio_mode: bool = False

    # Comma-separated exact browser origins.
    cors_origins: str = "http://localhost:3000"

    # Public demo limits
    max_csv_upload_bytes: int = 5 * 1024 * 1024
    max_analysis_accounts: int = 200

    # Live website enrichment limits
    enrichment_timeout_seconds: float = 8.0
    max_enrichment_redirects: int = 4
    max_enrichment_response_bytes: int = 2_000_000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
