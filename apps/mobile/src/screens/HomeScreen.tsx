import { ArrowLeft, ChevronRight, LocateFixed, MapPin, Navigation, Recycle, Search } from "lucide-react";
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
  selectedSmartBin: SmartBin | null;
  onOpenSmartBin: (device: SmartBin) => void;
  onCloseSmartBin: () => void;
};

export function HomeScreen({
  user,
  devices,
  transactions,
  onStart,
  onOpenActivity,
  onOpenEducation,
  selectedSmartBin,
  onOpenSmartBin,
  onCloseSmartBin
}: HomeScreenProps) {
  const nearest = devices[0];

  if (selectedSmartBin) {
    return <SmartBinDetailScreen device={selectedSmartBin} onBack={onCloseSmartBin} />;
  }

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
        <button className="smartbin-row" onClick={() => nearest && onOpenSmartBin(nearest)}>
          <img className="bin-illustration" src={figmaAssets.smartBinNearby} alt="" />
          <div>
            <strong>{nearest ? displaySmartBinName(nearest) : "Smart Bin EcoDrop"}</strong>
            <p>
              <MapPin size={12} />
              450m dari lokasi Anda
            </p>
          </div>
          <span className="smartbin-action" aria-hidden="true">
            <ChevronRight size={20} />
          </span>
        </button>
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

function displaySmartBinName(_device: SmartBin) {
  return "Smart Bin Labtek V ITB";
}

function SmartBinDetailScreen({ onBack }: { device: SmartBin; onBack: () => void }) {
  return (
    <section className="bin-detail-screen">
      <img className="bin-detail-map" src={figmaAssets.binMap} alt="" />
      <div className="bin-detail-fade" />

      <header className="bin-detail-search">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={20} />
        </button>
        <label>
          <span>Cari Lokasi</span>
          <Search size={18} />
        </label>
      </header>

      <div className="map-marker selected">
        <Recycle size={21} />
        <span>Labtek V ITB</span>
      </div>
      <div className="map-marker small one">
        <Recycle size={15} />
      </div>
      <div className="map-marker small two">
        <Recycle size={15} />
      </div>
      <button className="map-locate-button" aria-label="Lokasi saya">
        <LocateFixed size={22} />
      </button>

      <section className="bin-bottom-sheet">
        <span className="sheet-handle" />
        <div className="bin-sheet-heading">
          <h1>Smart Bin Labtek V ITB</h1>
          <strong>450m dari Anda</strong>
        </div>

        <section className="capacity-card">
          <div>
            <span>Kapasitas: 65% Penuh</span>
            <strong>Status: Aktif</strong>
          </div>
          <meter min={0} max={100} value={65} />
        </section>

        <section className="bin-address-row">
          <span>
            <MapPin size={20} />
          </span>
          <div>
            <p>Labtek V, Institut Teknologi Bandung</p>
            <small>Bandung, Jawa Barat</small>
          </div>
        </section>

        <button className="directions-button">
          <Navigation size={18} />
          Petunjuk Arah
        </button>
      </section>
    </section>
  );
}
