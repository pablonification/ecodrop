from typing import Optional
import httpx
from fastapi import UploadFile

from app.core.config import get_settings
from app.models.schemas import BottleValidation
from app.services.rewards import estimate_points


async def validate_bottle_image(image: UploadFile) -> BottleValidation:
    settings = get_settings()
    content = await image.read()
    if not content:
        return BottleValidation(is_valid=False, reason="Empty image upload.")

    if settings.use_mock_ai:
        mock_hint = f"{image.filename or ''} ".encode() + content[:512].lower()
        if b"invalid" in mock_hint or b"not-bottle" in mock_hint:
            return BottleValidation(
                is_valid=False,
                brand="Unknown",
                confidence=0.18,
                volume_ml=0,
                height_mm=0,
                diameter_mm=0,
                estimated_points=0,
                reason="Mock validation rejected the upload as a non-bottle object.",
            )
        return BottleValidation(
            is_valid=True,
            brand="Aqua",
            confidence=0.93,
            volume_ml=600,
            height_mm=215,
            diameter_mm=65,
            estimated_points=estimate_points(600),
            reason="Mock validation accepted the bottle for integration testing.",
        )

    async with httpx.AsyncClient(timeout=20) as client:
        files = {"image": (image.filename or "bottle.jpg", content, image.content_type)}
        response = await client.post(f"{settings.ai_cv_service_url}/validate-bottle", files=files)
        response.raise_for_status()
        payload = response.json()

    return BottleValidation(
        is_valid=bool(payload.get("is_valid")),
        brand=payload.get("brand", "Unknown"),
        confidence=float(payload.get("confidence", 0)),
        volume_ml=float(payload.get("volume_ml", 0)),
        height_mm=float(payload.get("height_mm", 0)),
        diameter_mm=float(payload.get("diameter_mm", 0)),
        estimated_points=int(payload.get("estimated_points", 0)),
        reason=payload.get("reason"),
        debug_image_url=_optional_str(payload.get("debug_image_url")),
    )


def _optional_str(value: object) -> Optional[str]:
    if isinstance(value, str) and value:
        return value
    return None
