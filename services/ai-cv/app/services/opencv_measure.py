from app.core.config import get_settings
from app.models.schemas import MeasurementResult


def estimate_measurements(content: bytes) -> MeasurementResult:
    try:
        import cv2
        import numpy as np
    except ImportError:
        return MeasurementResult(
            reference_box_detected=False,
            reason="OpenCV dependencies are not installed.",
        )

    image_array = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        return MeasurementResult(
            reference_box_detected=False,
            reason="Image bytes could not be decoded.",
        )

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, dark_mask = cv2.threshold(gray, 55, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return MeasurementResult(
            reference_box_detected=False,
            reason="Black reference box was not detected.",
        )

    reference_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(reference_contour)
    image_area = image.shape[0] * image.shape[1]
    if area < image_area * 0.02:
        return MeasurementResult(
            reference_box_detected=False,
            reason="Detected reference box is too small.",
        )

    x, y, width_px, height_px = cv2.boundingRect(reference_contour)
    if width_px <= 0 or height_px <= 0:
        return MeasurementResult(
            reference_box_detected=False,
            reason="Reference box bounds are invalid.",
        )

    settings = get_settings()
    mm_per_px = settings.reference_box_height_mm / height_px

    # Prototype approximation: bottle bounds are estimated from the bright foreground above the box.
    foreground_mask = cv2.bitwise_not(dark_mask)
    foreground_mask[y : y + height_px, x : x + width_px] = 0
    foreground_contours, _ = cv2.findContours(
        foreground_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not foreground_contours:
        return MeasurementResult(
            reference_box_detected=True,
            volume_ml=600,
            height_mm=215,
            diameter_mm=65,
            reason="Reference box detected; bottle contour fallback used.",
        )

    bottle_contour = max(foreground_contours, key=cv2.contourArea)
    _, _, bottle_width_px, bottle_height_px = cv2.boundingRect(bottle_contour)
    height_mm = max(120, min(340, bottle_height_px * mm_per_px))
    diameter_mm = max(45, min(105, bottle_width_px * mm_per_px))
    volume_ml = _estimate_cylindrical_volume(height_mm, diameter_mm)

    return MeasurementResult(
        reference_box_detected=True,
        volume_ml=volume_ml,
        height_mm=height_mm,
        diameter_mm=diameter_mm,
        reason="OpenCV reference box measurement completed.",
    )


def _estimate_cylindrical_volume(height_mm: float, diameter_mm: float) -> float:
    radius_cm = (diameter_mm / 10) / 2
    height_cm = height_mm / 10
    cylinder_ml = 3.14159 * radius_cm * radius_cm * height_cm
    return round(cylinder_ml * 0.62)
