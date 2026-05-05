from functools import lru_cache
from typing import Literal

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")

    ai_cv_mode: Literal["mock", "opencv", "roboflow"] = "mock"
    roboflow_api_key: str = ""
    roboflow_model_id: str = "merk-label/1"
    roboflow_api_url: str = "https://detect.roboflow.com"
    reference_box_height_mm: float = 160
    reference_box_width_mm: float = 110
    bottle_confidence_threshold: float = 0.65
    bottle_min_volume_ml: int = 250
    bottle_max_volume_ml: int = 2000
    points_per_100ml: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
