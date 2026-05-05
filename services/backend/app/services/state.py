from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from uuid import uuid4

from app.core.config import get_settings
from app.models.schemas import (
    AdminDashboardResponse,
    AdminOverview,
    BottleValidation,
    DepositSession,
    DepositTransaction,
    EducationArticle,
    SmartBin,
    SmartBinCommand,
    WithdrawalRequest,
)
from app.services.rewards import compute_tier


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryState:
    def __init__(self) -> None:
        self.users = {
            "user-demo-001": {
                "id": "user-demo-001",
                "name": "Arqila Surya Putra",
                "email": "arqila@example.com",
                "role": "user",
                "points": 12840,
                "tier": "Penjelajah",
            },
            "admin-demo-001": {
                "id": "admin-demo-001",
                "name": "EcoDrop Admin",
                "email": "admin@ecodrop.local",
                "role": "admin",
                "points": 0,
                "tier": "Perintis",
            },
        }
        self.devices: Dict[str, SmartBin] = {
            "ECO-SMARTBIN-001": SmartBin(
                id="ECO-SMARTBIN-001",
                name="EcoDrop ITB Kantin Barat",
                location_name="Kantin Barat ITB",
                latitude=-6.8915,
                longitude=107.6107,
                status="online",
                capacity_percent=42,
                last_heartbeat_at=now_utc(),
                firmware_version="0.1.0",
            )
        }
        self.sessions: Dict[str, DepositSession] = {}
        self.transactions: Dict[str, DepositTransaction] = {}
        self.commands: Dict[str, List[SmartBinCommand]] = {}
        self.articles: List[EducationArticle] = [
            EducationArticle(
                id="edu-001",
                title="Why PET Bottles Should Be Separated",
                excerpt="Clean PET bottles are easier to recycle and preserve material value.",
                content="PET bottles should be emptied, lightly rinsed, and separated from mixed waste.",
                category="plastic",
                published_at=now_utc() - timedelta(days=7),
            ),
            EducationArticle(
                id="edu-002",
                title="How EcoDrop Validates Deposits",
                excerpt="EcoDrop combines camera validation with SmartBin sensor confirmation.",
                content="Points are granted only after image validation and physical sensor confirmation.",
                category="recycling",
                published_at=now_utc() - timedelta(days=3),
            ),
        ]
        self.withdrawals: List[WithdrawalRequest] = [
            WithdrawalRequest(
                id="wd-001",
                user_id="user-demo-001",
                user_name="Arqila Surya Putra",
                points=5000,
                method="ewallet",
                account_target="081234567890",
                status="pending",
                requested_at=now_utc() - timedelta(hours=5),
            )
        ]

    def create_session(self, user_id: str, qr_token: str) -> DepositSession:
        device = self.devices.get(qr_token)
        if device is None:
            raise KeyError("SmartBin device is not registered.")
        if device.status not in ("online", "maintenance"):
            raise ValueError("SmartBin is not available.")
        session = DepositSession(
            id=f"sess-{uuid4().hex[:10]}",
            user_id=user_id,
            device_id=device.id,
            status="qr_validated",
            created_at=now_utc(),
            expires_at=now_utc() + timedelta(minutes=5),
        )
        self.sessions[session.id] = session
        return session

    def set_validation(self, session_id: str, validation: BottleValidation) -> DepositSession:
        session = self.sessions[session_id]
        settings = get_settings()
        session.validation = validation
        if validation.is_valid:
            session.status = "awaiting_insert"
            session.insert_deadline_at = now_utc() + timedelta(
                seconds=settings.deposit_insert_window_seconds
            )
            self.queue_command(
                session.device_id,
                action="open_lid",
                session_id=session.id,
                duration_seconds=settings.deposit_insert_window_seconds,
            )
        else:
            session.status = "rejected"
            self.create_failed_transaction(session, validation.reason or "Bottle validation failed.")
        self.sessions[session_id] = session
        return session

    def confirm_sensor(self, session_id: str) -> DepositTransaction:
        session = self.sessions[session_id]
        if session.status != "awaiting_insert" or session.validation is None:
            raise ValueError("Session is not awaiting SmartBin insertion.")
        if session.insert_deadline_at and now_utc() > session.insert_deadline_at:
            session.status = "failed"
            self.sessions[session.id] = session
            return self.create_failed_transaction(session, "Insert timer expired.")

        session.status = "completed"
        self.sessions[session.id] = session
        transaction = DepositTransaction(
            id=f"trx-{uuid4().hex[:10]}",
            session_id=session.id,
            user_id=session.user_id,
            device_id=session.device_id,
            brand=session.validation.brand,
            volume_ml=session.validation.volume_ml,
            points=session.validation.estimated_points,
            status="success",
            sensor_confirmed_at=now_utc(),
            created_at=now_utc(),
        )
        self.transactions[transaction.id] = transaction
        user = self.users.get(session.user_id)
        if user:
            user["points"] = int(user.get("points", 0)) + transaction.points
            user["tier"] = compute_tier(int(user["points"]))
        self.queue_command(session.device_id, action="close_lid", session_id=session.id)
        return transaction

    def create_failed_transaction(self, session: DepositSession, reason: str) -> DepositTransaction:
        transaction = DepositTransaction(
            id=f"trx-{uuid4().hex[:10]}",
            session_id=session.id,
            user_id=session.user_id,
            device_id=session.device_id,
            brand=session.validation.brand if session.validation else "Unknown",
            volume_ml=session.validation.volume_ml if session.validation else 0,
            points=0,
            status="failed",
            failure_reason=reason,
            created_at=now_utc(),
        )
        self.transactions[transaction.id] = transaction
        return transaction

    def queue_command(
        self,
        device_id: str,
        action: str,
        session_id: Optional[str] = None,
        duration_seconds: int = 10,
    ) -> SmartBinCommand:
        command = SmartBinCommand(
            id=f"cmd-{uuid4().hex[:10]}",
            device_id=device_id,
            action=action,
            session_id=session_id,
            duration_seconds=duration_seconds,
            status="queued",
            created_at=now_utc(),
        )
        self.commands.setdefault(device_id, []).append(command)
        return command

    def next_command(self, device_id: str) -> Optional[SmartBinCommand]:
        for command in self.commands.get(device_id, []):
            if command.status == "queued":
                command.status = "sent"
                return command
        return None

    def acknowledge_command(self, device_id: str, command_id: str, status: str) -> SmartBinCommand:
        for command in self.commands.get(device_id, []):
            if command.id == command_id:
                command.status = status
                return command
        raise KeyError("Command not found.")

    def dashboard(self) -> AdminDashboardResponse:
        transactions = list(self.transactions.values())
        overview = AdminOverview(
            total_users=len(self.users),
            total_transactions=len(transactions),
            total_volume_ml=sum(t.volume_ml for t in transactions if t.status == "success"),
            total_points_issued=sum(t.points for t in transactions if t.status == "success"),
            active_smart_bins=sum(1 for d in self.devices.values() if d.status == "online"),
            pending_withdrawals=sum(1 for w in self.withdrawals if w.status == "pending"),
        )
        return AdminDashboardResponse(
            overview=overview,
            devices=list(self.devices.values()),
            transactions=transactions[-20:],
            series=[
                {"label": "Mon", "transactions": 12, "volume_ml": 7200, "points": 720},
                {"label": "Tue", "transactions": 18, "volume_ml": 10800, "points": 1080},
                {"label": "Wed", "transactions": 15, "volume_ml": 9000, "points": 900},
                {"label": "Thu", "transactions": 24, "volume_ml": 14400, "points": 1440},
            ],
        )


state = InMemoryState()
