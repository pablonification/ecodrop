from typing import Dict

from app.models.schemas import (
    DepositSession,
    DepositTransaction,
    EducationArticle,
    IoTLog,
    SmartBin,
    SmartBinCommand,
    WithdrawalRequest,
)
from app.repositories.base import DictRepository


class InMemoryRepositories:
    def __init__(
        self,
        users: Dict[str, dict],
        devices: Dict[str, SmartBin],
    ) -> None:
        self.users = DictRepository[dict](users)
        self.devices = DictRepository[SmartBin](devices)
        self.sessions = DictRepository[DepositSession]()
        self.transactions = DictRepository[DepositTransaction]()
        self.commands = DictRepository[SmartBinCommand]()
        self.education = DictRepository[EducationArticle]()
        self.withdrawals = DictRepository[WithdrawalRequest]()
        self.iot_logs = DictRepository[IoTLog]()
