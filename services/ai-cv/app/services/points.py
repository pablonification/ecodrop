from app.core.config import get_settings


def estimate_points(volume_ml: float) -> int:
    settings = get_settings()
    return max(0, round((volume_ml / 100) * settings.points_per_100ml))
