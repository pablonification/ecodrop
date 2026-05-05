import { ArrowLeft, CheckCircle2, Download, Leaf } from "lucide-react";
import type { DepositTransaction } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import { TransactionItem } from "../components/TransactionItem";
import { figmaAssets } from "../assets/figma";

type ActivityScreenProps = {
  transactions: DepositTransaction[];
  selected: DepositTransaction | null;
  onSelect: (transaction: DepositTransaction) => void;
  onBack: () => void;
};

export function ActivityScreen({ transactions, selected, onSelect, onBack }: ActivityScreenProps) {
  if (selected) {
    return <ActivityDetail transaction={selected} onBack={onBack} />;
  }

  const successCount = transactions.filter((item) => item.status === "success").length;
  const totalPoints = transactions.reduce((sum, item) => sum + item.points, 0);

  return (
    <div className="screen-stack">
      <h1 className="screen-title">Aktivitas</h1>
      <section className="activity-summary">
        <div className="summary-green">
          <span>Scan Berhasil</span>
          <strong>{successCount || 42}</strong>
          <small>Total botol didaur ulang</small>
        </div>
        <div className="summary-white">
          <span>Total Poin</span>
          <strong>{totalPoints || 2450}</strong>
        </div>
      </section>
      <div className="segmented-control">
        <button className="active">Semua</button>
        <button>Setor</button>
        <button>Tarik</button>
        <button>Hadiah</button>
      </div>
      <section className="home-card">
        <span className="list-label">Hari Ini</span>
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onClick={() => onSelect(transaction)}
            />
          ))}
        </div>
      </section>
      <section
        className="reward-banner"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(2, 32, 22, 0.88), rgba(2, 32, 22, 0.42)), url(${figmaAssets.rewardForestBg})`
        }}
      >
        <h2>Tukar 5.000 Poin!</h2>
        <p>Dapatkan tote bag EcoDrop eksklusif</p>
        <button>Klaim Sekarang</button>
      </section>
    </div>
  );
}

function ActivityDetail({ transaction, onBack }: { transaction: DepositTransaction; onBack: () => void }) {
  return (
    <div className="detail-screen">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={20} />
        Detail Aktivitas
      </button>
      <div className="detail-hero">
        <CheckCircle2 size={62} />
        <h1>{transaction.status === "success" ? "Berhasil" : "Gagal"}</h1>
        <p>
          {transaction.status === "success"
            ? "Setoran diterima oleh EcoDrop"
            : transaction.failureReason ?? "Setoran tidak berhasil diproses"}
        </p>
      </div>
      <section className="detail-grid">
        <div>
          <span>Brand</span>
          <strong>{transaction.brand}</strong>
        </div>
        <div>
          <span>Volume</span>
          <strong>{transaction.volumeMl} mL</strong>
        </div>
      </section>
      <section className="points-card">
        <span>Total Perolehan</span>
        <strong>{transaction.points > 0 ? `+${transaction.points}` : "0"} Poin</strong>
      </section>
      <section className="home-card detail-info">
        <h2>Informasi Transaksi</h2>
        <InfoRow label="Waktu Setoran" value={formatDate(transaction.createdAt)} />
        <InfoRow label="Lokasi Smart Bin" value={transaction.deviceId} />
        <InfoRow label="ID Transaksi" value={transaction.id} />
      </section>
      <section className="impact-note">
        <Leaf size={22} />
        <p>Kontribusi Anda membantu mengurangi emisi karbon di area perkotaan.</p>
      </section>
      <section className="detail-impact-panel" aria-label="Dampak setoran">
        <Leaf size={24} />
        <div>
          <span>Estimasi dampak</span>
          <strong>1 botol plastik masuk jalur daur ulang</strong>
        </div>
      </section>
      <PrimaryButton onClick={onBack}>Kembali</PrimaryButton>
      <button className="receipt-link">
        <Download size={16} />
        Download Receipt
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
