from typing import Optional

from pydantic import BaseModel


class ValidationResponse(BaseModel):
    is_valid: bool
    brand: str
    confidence: float
    volume_ml: float
    height_mm: float
    diameter_mm: float
    estimated_points: int
    reason: str
    debug_image_url: Optional[str] = None


class BrandPrediction(BaseModel):
    brand: str = "Unknown"
    confidence: float = 0
    category: str = "plastic_bottle"


class MeasurementResult(BaseModel):
    reference_box_detected: bool
    volume_ml: float = 0
    height_mm: float = 0
    diameter_mm: float = 0
    reason: Optional[str] = None
