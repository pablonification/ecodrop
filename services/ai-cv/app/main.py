from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from typing import Optional


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


app = FastAPI(
    title="EcoDrop AI/CV Service",
    description="Mock-first bottle brand detection and OpenCV measurement service.",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ecodrop-ai-cv"}


@app.post("/validate-bottle", response_model=ValidationResponse)
async def validate_bottle(image: UploadFile = File(...)):
    content = await image.read()
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

    return ValidationResponse(
        is_valid=True,
        brand="Aqua",
        confidence=0.91,
        volume_ml=600,
        height_mm=215,
        diameter_mm=65,
        estimated_points=60,
        reason="Mock AI/CV response. Replace with Roboflow and OpenCV pipeline.",
    )
