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
    IoTLog,
    SmartBin,
    SmartBinCommand,
    CreateEducationArticleRequest,
    CreateWithdrawalRequest,
    UpdateEducationArticleRequest,
    WithdrawalRequest,
)
from app.repositories.memory import InMemoryRepositories
from app.services.rewards import compute_tier


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class InMemoryState:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        seeded_at = now_utc()
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
                last_heartbeat_at=seeded_at,
                firmware_version="0.1.0",
            )
        }
        self.sessions: Dict[str, DepositSession] = {}
        self.transactions: Dict[str, DepositTransaction] = {}
        self.transactions_by_session: Dict[str, str] = {}
        self.commands: Dict[str, List[SmartBinCommand]] = {}
        self.iot_logs: List[IoTLog] = []
        self.repositories = InMemoryRepositories(self.users, self.devices)
        self.articles: List[EducationArticle] = [
            EducationArticle(
                id="edu-001",
                title="Why PET Bottles Should Be Separated",
                excerpt="Clean PET bottles are easier to recycle and preserve material value.",
                content="PET bottles should be emptied, lightly rinsed, and separated from mixed waste.",
                category="plastic",
                published_at=seeded_at - timedelta(days=7),
            ),
            EducationArticle(
                id="edu-002",
                title="How EcoDrop Validates Deposits",
                excerpt="EcoDrop combines camera validation with SmartBin sensor confirmation.",
                content="Points are granted only after image validation and physical sensor confirmation.",
                category="recycling",
                published_at=seeded_at - timedelta(days=3),
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
                requested_at=seeded_at - timedelta(hours=5),
            )
        ]

    def create_session(self, user_id: str, qr_token: str) -> DepositSession:
        self.expire_stale_sessions()
        if user_id not in self.users:
            raise KeyError("User not found.")

        device = self.devices.get(qr_token)
        if device is None:
            raise KeyError("SmartBin device is not registered.")
        self.refresh_device_availability(device.id)
        if device.status != "online":
            raise ValueError("SmartBin is not available.")

        if self._has_active_session(user_id=user_id, device_id=device.id):
            raise ValueError("User already has an active deposit session for this SmartBin.")

        settings = get_settings()
        created_at = now_utc()
        session = DepositSession(
            id=f"sess-{uuid4().hex[:10]}",
            user_id=user_id,
            device_id=device.id,
            status="qr_validated",
            created_at=created_at,
            updated_at=created_at,
            expires_at=created_at + timedelta(minutes=settings.deposit_session_ttl_minutes),
        )
        self.sessions[session.id] = session
        return session

    def get_active_session(self, user_id: str, device_id: str) -> Optional[DepositSession]:
        self.expire_stale_sessions()
        active_statuses = {
            "created",
            "qr_validated",
            "image_uploaded",
            "validating",
            "validated",
            "awaiting_insert",
        }
        return next(
            (
                session
                for session in self.sessions.values()
                if session.user_id == user_id
                and session.device_id == device_id
                and session.status in active_statuses
            ),
            None,
        )

    def create_withdrawal(self, payload: CreateWithdrawalRequest) -> WithdrawalRequest:
        user = self.users.get(payload.user_id)
        if user is None:
            raise KeyError("User not found.")
        if int(user.get("points", 0)) < payload.points:
            raise ValueError("User does not have enough points for withdrawal.")
        withdrawal = WithdrawalRequest(
            id=f"wd-{uuid4().hex[:10]}",
            user_id=payload.user_id,
            user_name=str(user.get("name", "EcoDrop User")),
            points=payload.points,
            method=payload.method,
            account_target=payload.account_target,
            status="pending",
            requested_at=now_utc(),
        )
        self.withdrawals.append(withdrawal)
        return withdrawal

    def update_withdrawal_status(self, withdrawal_id: str, status: str) -> WithdrawalRequest:
        for withdrawal in self.withdrawals:
            if withdrawal.id == withdrawal_id:
                withdrawal.status = status
                return withdrawal
        raise KeyError("Withdrawal not found.")

    def create_education_article(
        self,
        payload: CreateEducationArticleRequest,
    ) -> EducationArticle:
        article = EducationArticle(
            id=f"edu-{uuid4().hex[:10]}",
            title=payload.title,
            excerpt=payload.excerpt,
            content=payload.content,
            category=payload.category,
            image_url=payload.image_url,
            published_at=now_utc(),
        )
        self.articles.insert(0, article)
        return article

    def update_education_article(
        self,
        article_id: str,
        payload: UpdateEducationArticleRequest,
    ) -> EducationArticle:
        for article in self.articles:
            if article.id == article_id:
                update = payload.model_dump(exclude_unset=True)
                for key, value in update.items():
                    setattr(article, key, value)
                return article
        raise KeyError("Education article not found.")

    def set_validation(self, session_id: str, validation: BottleValidation) -> DepositSession:
        self.expire_stale_sessions()
        session = self.sessions[session_id]
        if session.status == "awaiting_insert":
            return session
        if session.status not in ("qr_validated", "image_uploaded", "validating", "validated"):
            raise ValueError(f"Session cannot be validated from status {session.status}.")

        normalized = self.enforce_validation_rules(validation)
        session.validation = normalized
        session.updated_at = now_utc()
        if normalized.is_valid:
            settings = get_settings()
            session.status = "awaiting_insert"
            session.failure_reason = None
            session.insert_deadline_at = session.updated_at + timedelta(
                seconds=settings.deposit_insert_window_seconds
            )
            self.queue_command(
                session.device_id,
                action="open_lid",
                session_id=session.id,
                duration_seconds=settings.deposit_insert_window_seconds,
            )
        else:
            self.fail_session(session.id, normalized.reason or "Bottle validation failed.", "rejected")

        self.sessions[session_id] = session
        return session

    def enforce_validation_rules(self, validation: BottleValidation) -> BottleValidation:
        settings = get_settings()
        if not validation.is_valid:
            validation.estimated_points = 0
            return validation
        if validation.confidence < settings.bottle_confidence_threshold:
            validation.is_valid = False
            validation.estimated_points = 0
            validation.reason = "Bottle confidence is below the configured threshold."
        elif validation.volume_ml < settings.bottle_min_volume_ml:
            validation.is_valid = False
            validation.estimated_points = 0
            validation.reason = "Estimated bottle volume is too small for EcoDrop deposit."
        elif validation.volume_ml > settings.bottle_max_volume_ml:
            validation.is_valid = False
            validation.estimated_points = 0
            validation.reason = "Estimated bottle volume is outside the accepted range."
        return validation

    def confirm_sensor(self, session_id: str, device_id: Optional[str] = None) -> DepositTransaction:
        self.expire_stale_sessions()
        session = self.sessions[session_id]
        if device_id is not None and session.device_id != device_id:
            raise ValueError("Sensor event device does not match the deposit session.")

        existing = self.get_transaction_for_session(session_id)
        if session.status == "completed" and existing is not None:
            return existing
        if session.status in ("failed", "rejected", "expired") and existing is not None:
            return existing
        if session.status != "awaiting_insert" or session.validation is None:
            raise ValueError("Session is not awaiting SmartBin insertion.")
        if session.insert_deadline_at and now_utc() > session.insert_deadline_at:
            return self.fail_session(session.id, "Insert timer expired.", "failed")

        completed_at = now_utc()
        session.status = "completed"
        session.failure_reason = None
        session.updated_at = completed_at
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
            sensor_confirmed_at=completed_at,
            created_at=completed_at,
        )
        self.transactions[transaction.id] = transaction
        self.transactions_by_session[session.id] = transaction.id

        user = self.users.get(session.user_id)
        if user:
            user["points"] = int(user.get("points", 0)) + transaction.points
            user["tier"] = compute_tier(int(user["points"]))

        self.queue_command(session.device_id, action="close_lid", session_id=session.id)
        self.log_iot(
            device_id=session.device_id,
            event_type="sensor_detected",
            message="Bottle insertion confirmed and points awarded.",
            session_id=session.id,
        )
        return transaction

    def fail_session(
        self,
        session_id: str,
        reason: str,
        status: str = "failed",
    ) -> DepositTransaction:
        session = self.sessions[session_id]
        existing = self.get_transaction_for_session(session.id)
        if existing is not None:
            return existing

        session.status = status
        session.failure_reason = reason
        session.updated_at = now_utc()
        self.sessions[session.id] = session
        transaction = self.create_failed_transaction(session, reason)
        if status == "failed":
            self.queue_command(session.device_id, action="close_lid", session_id=session.id)
        self.log_iot(
            device_id=session.device_id,
            event_type="session_failed",
            message=reason,
            session_id=session.id,
        )
        return transaction

    def create_failed_transaction(self, session: DepositSession, reason: str) -> DepositTransaction:
        existing = self.get_transaction_for_session(session.id)
        if existing is not None:
            return existing

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
        self.transactions_by_session[session.id] = transaction.id
        return transaction

    def get_transaction_for_session(self, session_id: str) -> Optional[DepositTransaction]:
        transaction_id = self.transactions_by_session.get(session_id)
        if transaction_id is None:
            return None
        return self.transactions.get(transaction_id)

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
        self.log_iot(
            device_id=device_id,
            event_type="command_queued",
            message=f"Queued SmartBin command: {action}.",
            session_id=session_id,
            command_id=command.id,
        )
        return command

    def next_command(self, device_id: str) -> Optional[SmartBinCommand]:
        self.refresh_device_availability(device_id)
        for command in self.commands.get(device_id, []):
            if command.status == "queued":
                command.status = "sent"
                self.log_iot(
                    device_id=device_id,
                    event_type="command_sent",
                    message=f"Sent SmartBin command: {command.action}.",
                    session_id=command.session_id,
                    command_id=command.id,
                )
                return command
        return None

    def acknowledge_command(
        self,
        device_id: str,
        command_id: str,
        status: str,
        message: Optional[str] = None,
    ) -> SmartBinCommand:
        for command in self.commands.get(device_id, []):
            if command.id == command_id:
                command.status = status
                command.message = message
                command.acknowledged_at = now_utc()
                self.log_iot(
                    device_id=device_id,
                    event_type="command_failed" if status == "failed" else "command_acknowledged",
                    message=message or f"Command {status}.",
                    session_id=command.session_id,
                    command_id=command.id,
                )
                return command
        raise KeyError("Command not found.")

    def refresh_device_availability(self, device_id: str) -> Optional[SmartBin]:
        device = self.devices.get(device_id)
        if device is None or device.last_heartbeat_at is None:
            return device
        settings = get_settings()
        stale_after = timedelta(seconds=settings.device_heartbeat_stale_seconds)
        if device.status == "online" and now_utc() - device.last_heartbeat_at > stale_after:
            device.status = "offline"
        return device

    def expire_stale_sessions(self) -> None:
        current_time = now_utc()
        for session in list(self.sessions.values()):
            if session.status in ("completed", "failed", "rejected", "expired"):
                continue
            if session.status == "awaiting_insert" and session.insert_deadline_at:
                if current_time > session.insert_deadline_at:
                    self.fail_session(session.id, "Insert timer expired.", "failed")
            elif session.expires_at and current_time > session.expires_at:
                self.fail_session(
                    session.id,
                    "Deposit session expired before bottle validation.",
                    "expired",
                )

    def list_transactions(self, user_id: Optional[str] = None) -> List[DepositTransaction]:
        transactions = list(self.transactions.values())
        if user_id is not None:
            transactions = [transaction for transaction in transactions if transaction.user_id == user_id]
        return sorted(transactions, key=lambda transaction: transaction.created_at, reverse=True)

    def dashboard(self) -> AdminDashboardResponse:
        self.expire_stale_sessions()
        for device_id in list(self.devices.keys()):
            self.refresh_device_availability(device_id)

        transactions = self.list_transactions()
        successful_transactions = [t for t in transactions if t.status == "success"]
        overview = AdminOverview(
            total_users=len(self.users),
            total_transactions=len(transactions),
            total_volume_ml=sum(t.volume_ml for t in successful_transactions),
            total_points_issued=sum(t.points for t in successful_transactions),
            active_smart_bins=sum(1 for d in self.devices.values() if d.status == "online"),
            pending_withdrawals=sum(1 for w in self.withdrawals if w.status == "pending"),
        )
        return AdminDashboardResponse(
            overview=overview,
            devices=list(self.devices.values()),
            transactions=transactions[:20],
            series=self._dashboard_series(successful_transactions),
            iot_logs=self.iot_logs[-20:],
        )

    def log_iot(
        self,
        device_id: str,
        event_type: str,
        message: str,
        session_id: Optional[str] = None,
        command_id: Optional[str] = None,
    ) -> IoTLog:
        log = IoTLog(
            id=f"log-{uuid4().hex[:10]}",
            device_id=device_id,
            event_type=event_type,
            message=message,
            session_id=session_id,
            command_id=command_id,
            created_at=now_utc(),
        )
        self.iot_logs.append(log)
        self.iot_logs = self.iot_logs[-100:]
        return log

    def _dashboard_series(self, transactions: List[DepositTransaction]) -> List[dict]:
        current_time = now_utc()
        points = []
        for offset in range(6, -1, -1):
            day = current_time.date() - timedelta(days=offset)
            day_transactions = [t for t in transactions if t.created_at.date() == day]
            points.append(
                {
                    "label": day.strftime("%a"),
                    "transactions": len(day_transactions),
                    "volume_ml": sum(t.volume_ml for t in day_transactions),
                    "points": sum(t.points for t in day_transactions),
                }
            )
        return points

    def _has_active_session(self, user_id: str, device_id: str) -> bool:
        return self.get_active_session(user_id=user_id, device_id=device_id) is not None


state = InMemoryState()
