import { Banknote, ChevronRight, Recycle } from "lucide-react";
import type { DepositTransaction } from "@ecodrop/shared";

type TransactionItemProps = {
  transaction: DepositTransaction;
  onClick?: () => void;
};

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const isSuccess = transaction.status === "success";
  return (
    <button className="transaction-item" onClick={onClick}>
      <span className={isSuccess ? "item-icon green" : "item-icon gray"}>
        {isSuccess ? <Recycle size={18} /> : <Banknote size={18} />}
      </span>
      <span className="item-copy">
        <strong>{isSuccess ? `${transaction.brand} ${transaction.volumeMl}mL` : "Setoran gagal"}</strong>
        <small>{transaction.deviceId} • {formatTime(transaction.createdAt)}</small>
      </span>
      <span className={transaction.points > 0 ? "item-points plus" : "item-points"}>
        {transaction.points > 0 ? `+${transaction.points}` : "0"} Poin
      </span>
      {onClick && <ChevronRight size={16} />}
    </button>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
