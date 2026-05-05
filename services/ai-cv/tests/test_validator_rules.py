from app.models.schemas import BrandPrediction, MeasurementResult
from app.services.validator import build_validation_response


def test_validator_rejects_missing_reference_box():
    response = build_validation_response(
        BrandPrediction(brand="Aqua", confidence=0.9),
        MeasurementResult(reference_box_detected=False, reason="Black reference box missing."),
    )

    assert response.is_valid is False
    assert response.estimated_points == 0
    assert "reference" in response.reason.lower()


def test_validator_rejects_low_confidence():
    response = build_validation_response(
        BrandPrediction(brand="Aqua", confidence=0.2),
        MeasurementResult(
            reference_box_detected=True,
            volume_ml=600,
            height_mm=215,
            diameter_mm=65,
        ),
    )

    assert response.is_valid is False
    assert response.estimated_points == 0
    assert "confidence" in response.reason.lower()


def test_validator_accepts_valid_measurement_and_prediction():
    response = build_validation_response(
        BrandPrediction(brand="Cleo", confidence=0.91),
        MeasurementResult(
            reference_box_detected=True,
            volume_ml=330,
            height_mm=165,
            diameter_mm=56,
        ),
    )

    assert response.is_valid is True
    assert response.brand == "Cleo"
    assert response.estimated_points == 33
