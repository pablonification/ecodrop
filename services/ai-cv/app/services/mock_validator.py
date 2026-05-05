from app.models.schemas import ValidationResponse
from app.services.points import estimate_points


KNOWN_BRANDS = ["Aqua", "Le Minerale", "Cleo", "Vit", "Pristine"]


def validate_with_mock(filename: str, content: bytes) -> ValidationResponse:
    hint = f"{filename} ".encode().lower() + content[:1024].lower()
    if b"invalid" in hint or b"not-bottle" in hint or b"non-bottle" in hint:
        return ValidationResponse(
            is_valid=False,
            brand="Unknown",
            confidence=0.18,
            volume_ml=0,
            height_mm=0,
            diameter_mm=0,
            estimated_points=0,
            reason="Mock validation rejected the upload as a non-bottle object.",
        )

    brand = _brand_from_hint(hint)
    volume_ml = _volume_from_hint(hint)
    return ValidationResponse(
        is_valid=True,
        brand=brand,
        confidence=0.93,
        volume_ml=volume_ml,
        height_mm=_height_for_volume(volume_ml),
        diameter_mm=_diameter_for_volume(volume_ml),
        estimated_points=estimate_points(volume_ml),
        reason="Mock validation accepted the bottle for integration testing.",
    )


def _brand_from_hint(hint: bytes) -> str:
    normalized = hint.decode(errors="ignore").replace("_", " ").replace("-", " ")
    for brand in KNOWN_BRANDS:
        if brand.lower() in normalized:
            return brand
    return "Aqua"


def _volume_from_hint(hint: bytes) -> float:
    if b"1500" in hint or b"1.5l" in hint:
        return 1500
    if b"330" in hint:
        return 330
    if b"250" in hint:
        return 250
    return 600


def _height_for_volume(volume_ml: float) -> float:
    if volume_ml >= 1500:
        return 315
    if volume_ml <= 330:
        return 165
    return 215


def _diameter_for_volume(volume_ml: float) -> float:
    if volume_ml >= 1500:
        return 88
    if volume_ml <= 330:
        return 56
    return 65
