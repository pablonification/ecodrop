from fastapi import FastAPI, File, UploadFile

from app.core.config import get_settings
from app.models.schemas import ValidationResponse
from app.services.validator import validate_bottle_image


app = FastAPI(
    title="EcoDrop AI/CV Service",
    description="Mock-first bottle brand detection and OpenCV measurement service.",
    version="0.2.0",
)


@app.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "service": "ecodrop-ai-cv",
        "mode": settings.ai_cv_mode,
        "roboflow_model_id": settings.roboflow_model_id,
    }


@app.post("/validate-bottle", response_model=ValidationResponse)
async def validate_bottle(image: UploadFile = File(...)):
    content = await image.read()
    return await validate_bottle_image(image.filename or "bottle.jpg", content)
