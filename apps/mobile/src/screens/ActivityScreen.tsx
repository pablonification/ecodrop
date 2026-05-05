import { useEffect, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, Check, ChevronRight, Download, MapPin, ReceiptText, Share2 } from "lucide-react";
import type { DepositTransaction } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import { TransactionItem } from "../components/TransactionItem";
import { figmaAssets } from "../assets/figma";

type ActivityScreenProps = {
  transactions: DepositTransaction[];
  selected: DepositTransaction | null;
  onSelect: (transaction: DepositTransaction) => void;
  onBack: () => void;
  onOpenReward: () => void;
};

export function ActivityScreen({ transactions, selected, onSelect, onBack, onOpenReward }: ActivityScreenProps) {
  useEffect(() => {
    document.querySelector(".activity-content")?.scrollTo({ top: 0 });
  }, [selected]);

  if (selected) {
    return <ActivityDetail transaction={selected} onBack={onBack} />;
  }

  const successCount = transactions.filter((item) => item.status === "success").length;
  const totalPoints = transactions.reduce((sum, item) => sum + item.points, 0);

  return (
    <div className="activity-screen">
      <header className="activity-topbar">
        <h1>Aktivitas</h1>
      </header>
      <section className="activity-summary">
        <div className="summary-green">
          <img className="summary-scan-deco" src={figmaAssets.activityScanDeco} alt="" />
          <span>Scan Berhasil</span>
          <strong>{successCount || 42}</strong>
          <small>Total botol didaur ulang</small>
        </div>
        <div className="summary-white">
          <span className="summary-points-icon">
            <img src={figmaAssets.activityPointsIcon} alt="" />
          </span>
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
      <section className="activity-group">
        <span className="list-label">Hari Ini</span>
        <div className="transaction-list activity-list">
          {transactions.slice(0, 2).map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} onClick={() => onSelect(transaction)} />
          ))}
        </div>
      </section>
      <section className="activity-group">
        <span className="list-label">Minggu Ini</span>
        <div className="transaction-list activity-list">
          {transactions.slice(2).map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} onClick={() => onSelect(transaction)} />
          ))}
        </div>
      </section>
      <section className="reward-banner">
        <img className="reward-banner-image" src={figmaAssets.activityRewardBanner} alt="" />
        <div className="reward-banner-copy">
          <h2>Tukar 5.000 Poin!</h2>
          <p>Dapatkan tote bag EcoDrop eksklusif</p>
          <button onClick={onOpenReward}>Klaim Sekarang</button>
        </div>
      </section>
    </div>
  );
}

function ActivityDetail({ transaction, onBack }: { transaction: DepositTransaction; onBack: () => void }) {
  return (
    <div className="activity-detail-screen">
      <header className="activity-detail-topbar">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={16} />
        </button>
        <h1>Detail Aktivitas</h1>
        <button aria-label="Bagikan aktivitas">
          <Share2 size={18} />
        </button>
      </header>
      <div className="detail-hero">
        <span className="status-check">
          <Check size={40} />
        </span>
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
        <div className="points-card-inner">
          <span className="points-star">
            <img src={figmaAssets.activityDetailStar} alt="" />
          </span>
          <div className="points-copy">
            <span>Total Perolehan</span>
            <strong>{transaction.points > 0 ? `+${transaction.points}` : "0"} Poin</strong>
          </div>
          <ChevronRight size={18} />
        </div>
      </section>
      <section className="detail-info">
        <h2>Informasi Transaksi</h2>
        <InfoRow icon={<CalendarDays size={17} />} label="Waktu Setoran" value="12 Okt 2024, 14:20 WIB" />
        <InfoRow icon={<MapPin size={17} />} label="Lokasi Smart Bin" value="Thamrin City, Jakarta" />
        <InfoRow icon={<ReceiptText size={17} />} label="ID Transaksi" value="TRX-882940" mono />
      </section>
      <section
        className="impact-note"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(25, 28, 30, 0.8), rgba(25, 28, 30, 0)), url(${figmaAssets.activityImpact})`
        }}
      >
        <p>Kontribusi Anda telah membantu mengurangi 0.4kg emisi karbon di area perkotaan.</p>
      </section>
      <footer className="activity-detail-footer">
        <PrimaryButton onClick={onBack}>Kembali</PrimaryButton>
        <div>
          <button className="receipt-link">
            <Download size={16} />
            Download Receipt
          </button>
          <span>|</span>
          <button className="receipt-link">Report Issue</button>
        </div>
      </footer>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row">
      <span className="info-icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong className={mono ? "mono" : undefined}>{value}</strong>
      </span>
    </div>
  );
}
