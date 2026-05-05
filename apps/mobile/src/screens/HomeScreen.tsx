import { ChevronRight, MapPin } from "lucide-react";
import type { DepositTransaction, EcoUser, SmartBin } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import { TransactionItem } from "../components/TransactionItem";
import { figmaAssets } from "../assets/figma";

type HomeScreenProps = {
  user: EcoUser;
  devices: SmartBin[];
  transactions: DepositTransaction[];
  onStart: () => void;
  onOpenActivity: () => void;
  onOpenEducation: () => void;
};

export function HomeScreen({
  user,
  devices,
  transactions,
  onStart,
  onOpenActivity,
  onOpenEducation
}: HomeScreenProps) {
  const nearest = devices[0];
  return (
    <div className="screen-stack">
      <section className="balance-hero">
        <span>Total Poin Kamu</span>
        <strong>{user.points.toLocaleString("id-ID")} Poin</strong>
        <div>
          <small>Nilai Konversi Rupiah</small>
          <b>≈ Rp {(user.points * 100).toLocaleString("id-ID")}</b>
          <button>Tarik Poin</button>
        </div>
      </section>

      <section className="home-card compact">
        <div className="section-row">
          <h2>Smart Bin Terdekat</h2>
          <button>Lihat Semua</button>
        </div>
        <article className="smartbin-row">
          <img className="bin-illustration" src={figmaAssets.smartBinThumb} alt="" />
          <div>
            <strong>{nearest?.name ?? "Smart Bin EcoDrop"}</strong>
            <p>
              <MapPin size={12} />
              {nearest?.locationName ?? "Labtek V ITB"} • {nearest?.status ?? "online"}
            </p>
          </div>
          <ChevronRight size={18} />
        </article>
      </section>

      <section className="home-card">
        <div className="section-row">
          <h2>Riwayat Penukaran</h2>
          <button onClick={onOpenActivity}>Lihat Semua</button>
        </div>
        <div className="transaction-list">
          {transactions.slice(0, 3).map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </section>

      <button className="eco-tip" onClick={onOpenEducation}>
        <span className="card-eyebrow">Tips Hari Ini</span>
        <h2>Cara memilah plastik rumah tangga dengan benar</h2>
        <strong>Baca Selengkapnya</strong>
        <span className="tip-watermark" aria-hidden="true">
          ECO
        </span>
        <span className="tip-shape" aria-hidden="true" />
      </button>

      <PrimaryButton onClick={onStart} className="home-cta">
        Mulai Setor Botol
      </PrimaryButton>
    </div>
  );
}
