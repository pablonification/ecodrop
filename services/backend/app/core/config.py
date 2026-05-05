from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ecodrop_env: str = "development"
    jwt_secret_key: str = "replace-me-for-demo"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "ecodrop"
    redis_url: str = "redis://localhost:6379/0"
    ai_cv_service_url: str = "http://localhost:8010"
    use_mock_ai: bool = True
    use_mock_db: bool = True
    command_mode: str = "hybrid"
    deposit_insert_window_seconds: int = 10
    deposit_session_ttl_minutes: int = 5
    device_heartbeat_stale_seconds: int = 120
    bottle_confidence_threshold: float = 0.65
    bottle_min_volume_ml: int = 250
    bottle_max_volume_ml: int = 2000
    points_per_100ml: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
