from typing import Optional

from fastapi import Depends, Header, HTTPException, Query

from app.core.config import get_settings
from app.services.state import state


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    user_id: str = "user-demo-001",
) -> dict:
    if authorization and authorization.startswith("Bearer dev-token-"):
        user_id = authorization.removeprefix("Bearer dev-token-")
    user = state.users.get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid development user.")
    return user


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


def require_device_token(
    x_device_token: Optional[str] = Header(default=None),
    device_token: Optional[str] = Query(default=None),
) -> bool:
    settings = get_settings()
    supplied_token = x_device_token or device_token
    if settings.ecodrop_env == "development" and supplied_token is None:
        return True
    if not supplied_token or supplied_token != settings.ecodrop_device_token:
        raise HTTPException(status_code=401, detail="Invalid SmartBin device token.")
    return True
