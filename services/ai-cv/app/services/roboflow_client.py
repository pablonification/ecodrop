import httpx

from app.core.config import get_settings
from app.models.schemas import BrandPrediction


async def predict_brand_with_roboflow(filename: str, content: bytes) -> BrandPrediction:
    settings = get_settings()
    if not settings.roboflow_api_key:
        return BrandPrediction(
            brand="Unknown",
            confidence=0,
            category="unknown",
        )

    endpoint = (
        f"{settings.roboflow_api_url.rstrip('/')}/{settings.roboflow_model_id}"
        f"?api_key={settings.roboflow_api_key}"
    )
    async with httpx.AsyncClient(timeout=25) as client:
        response = await client.post(
            endpoint,
            files={"file": (filename or "bottle.jpg", content, "image/jpeg")},
        )
        response.raise_for_status()
    payload = response.json()
    predictions = payload.get("predictions") or []
    if not predictions:
        return BrandPrediction(brand="Unknown", confidence=0, category="unknown")

    best = max(predictions, key=lambda item: float(item.get("confidence", 0)))
    return BrandPrediction(
        brand=_normalize_brand(str(best.get("class") or "Unknown")),
        confidence=float(best.get("confidence", 0)),
        category=str(best.get("class") or "plastic_bottle"),
    )


def _normalize_brand(raw_brand: str) -> str:
    normalized = raw_brand.replace("_", " ").replace("-", " ").strip().lower()
    aliases = {
        "aqua": "Aqua",
        "le minerale": "Le Minerale",
        "lemineral": "Le Minerale",
        "cleo": "Cleo",
        "vit": "Vit",
        "pristine": "Pristine",
    }
    return aliases.get(normalized, raw_brand.title() if raw_brand else "Unknown")
