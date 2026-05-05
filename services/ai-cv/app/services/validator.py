import httpx

from app.core.config import get_settings
from app.models.schemas import BrandPrediction, MeasurementResult, ValidationResponse
from app.services.mock_validator import validate_with_mock
from app.services.opencv_measure import estimate_measurements
from app.services.points import estimate_points
from app.services.roboflow_client import predict_brand_with_roboflow


async def validate_bottle_image(filename: str, content: bytes) -> ValidationResponse:
    if not content:
        return ValidationResponse(
            is_valid=False,
            brand="Unknown",
            confidence=0,
            volume_ml=0,
            height_mm=0,
            diameter_mm=0,
            estimated_points=0,
            reason="Empty image upload.",
        )

    settings = get_settings()
    if settings.ai_cv_mode == "mock":
        return validate_with_mock(filename, content)

    measurement = estimate_measurements(content)
    if settings.ai_cv_mode == "opencv":
        prediction = BrandPrediction(brand="Unknown", confidence=0.7, category="plastic_bottle")
    else:
        try:
            prediction = await predict_brand_with_roboflow(filename, content)
        except httpx.HTTPError as exc:
            return ValidationResponse(
                is_valid=False,
                brand="Unknown",
                confidence=0,
                volume_ml=0,
                height_mm=0,
                diameter_mm=0,
                estimated_points=0,
                reason=f"Roboflow prediction failed: {exc.__class__.__name__}.",
            )

    return build_validation_response(prediction, measurement)


def build_validation_response(
    prediction: BrandPrediction,
    measurement: MeasurementResult,
) -> ValidationResponse:
    settings = get_settings()
    if not measurement.reference_box_detected:
        return ValidationResponse(
            is_valid=False,
            brand=prediction.brand,
            confidence=prediction.confidence,
            volume_ml=0,
            height_mm=0,
            diameter_mm=0,
            estimated_points=0,
            reason=measurement.reason or "Black reference box was not detected.",
        )
    if prediction.confidence < settings.bottle_confidence_threshold:
        return ValidationResponse(
            is_valid=False,
            brand=prediction.brand,
            confidence=prediction.confidence,
            volume_ml=measurement.volume_ml,
            height_mm=measurement.height_mm,
            diameter_mm=measurement.diameter_mm,
            estimated_points=0,
            reason="Brand confidence is below the configured threshold.",
        )
    if measurement.volume_ml < settings.bottle_min_volume_ml:
        return ValidationResponse(
            is_valid=False,
            brand=prediction.brand,
            confidence=prediction.confidence,
            volume_ml=measurement.volume_ml,
            height_mm=measurement.height_mm,
            diameter_mm=measurement.diameter_mm,
            estimated_points=0,
            reason="Estimated bottle volume is too small for EcoDrop deposit.",
        )
    if measurement.volume_ml > settings.bottle_max_volume_ml:
        return ValidationResponse(
            is_valid=False,
            brand=prediction.brand,
            confidence=prediction.confidence,
            volume_ml=measurement.volume_ml,
            height_mm=measurement.height_mm,
            diameter_mm=measurement.diameter_mm,
            estimated_points=0,
            reason="Estimated bottle volume is outside the accepted range.",
        )

    return ValidationResponse(
        is_valid=True,
        brand=prediction.brand,
        confidence=prediction.confidence,
        volume_ml=measurement.volume_ml,
        height_mm=measurement.height_mm,
        diameter_mm=measurement.diameter_mm,
        estimated_points=estimate_points(measurement.volume_ml),
        reason=measurement.reason or "Bottle accepted.",
    )
