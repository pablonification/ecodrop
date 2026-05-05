from datetime import datetime
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


UserRole = Literal["user", "admin", "technician"]
SmartBinStatus = Literal["online", "offline", "maintenance", "error"]
DepositSessionStatus = Literal[
    "created",
    "qr_validated",
    "image_uploaded",
    "validating",
    "validated",
    "rejected",
    "awaiting_insert",
    "sensor_confirmed",
    "completed",
    "failed",
    "expired",
]
TransactionStatus = Literal["success", "failed", "pending", "rejected"]
WithdrawalStatus = Literal["pending", "approved", "rejected", "paid"]


class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole = "user"
    points: int = 0
    tier: str = "Perintis"


class SmartBin(BaseModel):
    id: str
    name: str
    location_name: str
    latitude: float
    longitude: float
    status: SmartBinStatus = "offline"
    capacity_percent: int = 0
    last_heartbeat_at: Optional[datetime] = None
    firmware_version: Optional[str] = None


class BottleValidation(BaseModel):
    is_valid: bool
    brand: str = "Unknown"
    confidence: float = 0
    volume_ml: float = 0
    height_mm: float = 0
    diameter_mm: float = 0
    estimated_points: int = 0
    reason: Optional[str] = None
    debug_image_url: Optional[str] = None


class DepositSession(BaseModel):
    id: str
    user_id: str
    device_id: str
    status: DepositSessionStatus = "created"
    validation: Optional[BottleValidation] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    insert_deadline_at: Optional[datetime] = None


class DepositTransaction(BaseModel):
    id: str
    session_id: str
    user_id: str
    device_id: str
    brand: str
    volume_ml: float
    points: int
    status: TransactionStatus
    failure_reason: Optional[str] = None
    sensor_confirmed_at: Optional[datetime] = None
    created_at: datetime


class EducationArticle(BaseModel):
    id: str
    title: str
    excerpt: str
    content: str
    category: str
    published_at: datetime
    image_url: Optional[str] = None


class WithdrawalRequest(BaseModel):
    id: str
    user_id: str
    user_name: str
    points: int
    method: Literal["bank_transfer", "ewallet"]
    account_target: str
    status: WithdrawalStatus = "pending"
    requested_at: datetime


class CreateWithdrawalRequest(BaseModel):
    user_id: str = "user-demo-001"
    points: int = Field(..., gt=0)
    method: Literal["bank_transfer", "ewallet"]
    account_target: str


class UpdateWithdrawalStatusRequest(BaseModel):
    status: WithdrawalStatus


class CreateEducationArticleRequest(BaseModel):
    title: str
    excerpt: str
    content: str
    category: Literal["recycling", "lifestyle", "plastic", "campaign"]
    image_url: Optional[str] = None


class UpdateEducationArticleRequest(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[Literal["recycling", "lifestyle", "plastic", "campaign"]] = None
    image_url: Optional[str] = None


class AdminOverview(BaseModel):
    total_users: int
    total_transactions: int
    total_volume_ml: float
    total_points_issued: int
    active_smart_bins: int
    pending_withdrawals: int


class CreateSessionRequest(BaseModel):
    qr_token: str = Field(..., examples=["ECO-SMARTBIN-001"])
    user_id: str = "user-demo-001"


class SensorEventRequest(BaseModel):
    session_id: str
    sensor_state: Literal["object_detected", "clear"]
    raw_value: Optional[int] = None
    event_id: Optional[str] = None


class DeviceRegistrationRequest(BaseModel):
    device_id: str
    firmware_version: Optional[str] = None
    location_name: Optional[str] = None
    ip_address: Optional[str] = None


class HeartbeatRequest(BaseModel):
    status: SmartBinStatus = "online"
    capacity_percent: int = Field(default=0, ge=0, le=100)
    firmware_version: Optional[str] = None


class SmartBinCommand(BaseModel):
    id: str
    device_id: str
    action: Literal["open_lid", "close_lid", "noop"]
    session_id: Optional[str] = None
    duration_seconds: int = 10
    status: Literal["queued", "sent", "acknowledged", "failed"] = "queued"
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    message: Optional[str] = None
    metadata: Dict[str, str] = Field(default_factory=dict)


class CommandAckRequest(BaseModel):
    status: Literal["acknowledged", "failed"]
    message: Optional[str] = None


class ApiEnvelope(BaseModel):
    data: object
    message: Optional[str] = None


class DashboardSeriesPoint(BaseModel):
    label: str
    transactions: int
    volume_ml: float
    points: int


class IoTLog(BaseModel):
    id: str
    device_id: str
    event_type: Literal[
        "device_registered",
        "heartbeat",
        "command_queued",
        "command_sent",
        "command_acknowledged",
        "command_failed",
        "sensor_detected",
        "sensor_ignored",
        "session_failed",
    ]
    message: str
    session_id: Optional[str] = None
    command_id: Optional[str] = None
    created_at: datetime


class AdminDashboardResponse(BaseModel):
    overview: AdminOverview
    devices: List[SmartBin]
    transactions: List[DepositTransaction]
    series: List[DashboardSeriesPoint]
    iot_logs: List[IoTLog] = Field(default_factory=list)
