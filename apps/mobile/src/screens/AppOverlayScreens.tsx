import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Gift,
  Headphones,
  LocateFixed,
  Mail,
  MapPin,
  MessageCircle,
  Recycle,
  Search,
  Send,
  WalletCards
} from "lucide-react";
import type { EcoUser, SmartBin } from "@ecodrop/shared";
import { figmaAssets } from "../assets/figma";
import { PrimaryButton } from "../components/PrimaryButton";
import type { OverlayView } from "../types";

type OverlayScreensProps = {
  view: OverlayView;
  user: EcoUser;
  devices: SmartBin[];
  onBack: () => void;
  onOpenView: (view: OverlayView) => void;
  onOpenSmartBin: (device: SmartBin) => void;
  onStartDeposit: () => void;
};

const withdrawalHistory = [
  {
    id: "WD-2405-003",
    points: 5000,
    amount: "Rp 500.000",
    target: "GoPay • 0812 3456 7890",
    status: "pending",
    requestedAt: "05 Mei 2026, 10.15"
  },
  {
    id: "WD-1904-012",
    points: 3000,
    amount: "Rp 300.000",
    target: "DANA • 0812 3456 7890",
    status: "paid",
    requestedAt: "19 April 2026, 16.40"
  },
  {
    id: "WD-1204-009",
    points: 2500,
    amount: "Rp 250.000",
    target: "BCA • 1234567890",
    status: "approved",
    requestedAt: "12 April 2026, 09.30"
  }
];

const notificationGroups = [
  {
    label: "Hari Ini",
    items: [
      {
        icon: <Recycle size={18} />,
        title: "Setoran berhasil",
        body: "Aqua 600mL diterima di ECO-SMARTBIN-001. +60 poin sudah masuk.",
        time: "14.29",
        tone: "success"
      },
      {
        icon: <WalletCards size={18} />,
        title: "Penarikan sedang ditinjau",
        body: "Permintaan WD-2405-003 menunggu verifikasi admin.",
        time: "10.15",
        tone: "warning"
      }
    ]
  },
  {
    label: "Sebelumnya",
    items: [
      {
        icon: <Bell size={18} />,
        title: "Smart Bin terdekat aktif",
        body: "Labtek V ITB tersedia dan kapasitas masih aman untuk setoran.",
        time: "Kemarin",
        tone: "neutral"
      },
      {
        icon: <Gift size={18} />,
        title: "Reward baru tersedia",
        body: "Tote bag EcoDrop bisa diklaim mulai dari 5.000 poin.",
        time: "03 Mei",
        tone: "success"
      }
    ]
  }
];

export function AppOverlayScreens({
  view,
  user,
  devices,
  onBack,
  onOpenView,
  onOpenSmartBin,
  onStartDeposit
}: OverlayScreensProps) {
  if (view === "withdraw") {
    return <WithdrawalRequestScreen user={user} onBack={onBack} onOpenHistory={() => onOpenView("withdrawal-history")} />;
  }
  if (view === "withdrawal-history") {
    return <WithdrawalHistoryScreen onBack={onBack} onOpenWithdraw={() => onOpenView("withdraw")} />;
  }
  if (view === "notifications") {
    return <NotificationsScreen onBack={onBack} onOpenReward={() => onOpenView("reward")} />;
  }
  if (view === "support") {
    return <SupportScreen user={user} onBack={onBack} />;
  }
  if (view === "smartbins") {
    return (
      <SmartBinsScreen
        devices={devices}
        onBack={onBack}
        onOpenSmartBin={onOpenSmartBin}
        onStartDeposit={onStartDeposit}
      />
    );
  }
  return <RewardClaimScreen user={user} onBack={onBack} />;
}

function OverlayShell({
  title,
  eyebrow,
  onBack,
  action,
  children,
  className = ""
}: {
  title: string;
  eyebrow?: string;
  onBack: () => void;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overlay-screen ${className}`}>
      <header className="overlay-topbar">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={20} />
        </button>
        <div>
          {eyebrow && <span>{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
        {action ?? <span />}
      </header>
      {children}
    </section>
  );
}

function WithdrawalRequestScreen({
  user,
  onBack,
  onOpenHistory
}: {
  user: EcoUser;
  onBack: () => void;
  onOpenHistory: () => void;
}) {
  const [method, setMethod] = useState<"ewallet" | "bank">("ewallet");
  const [points, setPoints] = useState(5000);
  const [target, setTarget] = useState("0812 3456 7890");
  const [submitted, setSubmitted] = useState(false);
  const amount = points * 100;
  const isEnough = points >= 1000 && points <= user.points && target.trim().length >= 6;

  return (
    <OverlayShell title="Tarik Poin" eyebrow="Saldo EcoDrop" onBack={onBack}>
      <div className="overlay-stack">
        <section className="withdraw-hero">
          <span>Total Poin Tersedia</span>
          <strong>{user.points.toLocaleString("id-ID")} Poin</strong>
          <p>Setara sekitar Rp {(user.points * 100).toLocaleString("id-ID")}</p>
        </section>

        {submitted ? (
          <section className="completion-panel">
            <span>
              <Check size={28} />
            </span>
            <h2>Permintaan dikirim</h2>
            <p>Admin EcoDrop akan memverifikasi tujuan pencairan sebelum saldo dikirim.</p>
            <div className="mini-receipt">
              <span>{points.toLocaleString("id-ID")} Poin</span>
              <strong>Rp {amount.toLocaleString("id-ID")}</strong>
              <small>{method === "ewallet" ? "E-wallet" : "Transfer Bank"} • {target}</small>
            </div>
            <PrimaryButton onClick={onOpenHistory}>Lihat Riwayat Penarikan</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={onBack}>Kembali</PrimaryButton>
          </section>
        ) : (
          <>
            <section className="task-card">
              <div className="task-card-heading">
                <span>
                  <WalletCards size={20} />
                </span>
                <div>
                  <h2>Nominal Penarikan</h2>
                  <p>Pilih nominal yang mudah diverifikasi.</p>
                </div>
              </div>
              <div className="amount-chip-row">
                {[1000, 3000, 5000, 10000].map((value) => (
                  <button
                    type="button"
                    className={points === value ? "active" : ""}
                    key={value}
                    onClick={() => setPoints(value)}
                    disabled={value > user.points}
                  >
                    {value.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>
              <label className="overlay-field">
                <span>Atau masukkan poin</span>
                <input
                  inputMode="numeric"
                  value={points}
                  onChange={(event) => setPoints(Number(event.currentTarget.value.replace(/\D/g, "")) || 0)}
                />
              </label>
            </section>

            <section className="task-card">
              <div className="segmented-choice">
                <button className={method === "ewallet" ? "active" : ""} type="button" onClick={() => setMethod("ewallet")}>
                  E-wallet
                </button>
                <button className={method === "bank" ? "active" : ""} type="button" onClick={() => setMethod("bank")}>
                  Bank
                </button>
              </div>
              <label className="overlay-field">
                <span>{method === "ewallet" ? "Nomor e-wallet" : "Nomor rekening"}</span>
                <input value={target} onChange={(event) => setTarget(event.currentTarget.value)} />
              </label>
            </section>

            <section className="withdraw-summary">
              <span>Estimasi diterima</span>
              <strong>Rp {amount.toLocaleString("id-ID")}</strong>
              <small>Biaya admin Rp 0. Proses maksimal 1 x 24 jam.</small>
            </section>

            <PrimaryButton onClick={() => setSubmitted(true)} disabled={!isEnough}>
              Ajukan Penarikan
            </PrimaryButton>
            {!isEnough && <p className="helper-warning">Minimal 1.000 poin dan tujuan pencairan harus valid.</p>}
          </>
        )}
      </div>
    </OverlayShell>
  );
}

function WithdrawalHistoryScreen({ onBack, onOpenWithdraw }: { onBack: () => void; onOpenWithdraw: () => void }) {
  return (
    <OverlayShell title="Riwayat Penarikan" eyebrow="Pencairan reward" onBack={onBack}>
      <div className="overlay-stack">
        <section className="history-summary">
          <div>
            <span>Menunggu</span>
            <strong>1</strong>
          </div>
          <div>
            <span>Selesai</span>
            <strong>2</strong>
          </div>
        </section>

        <section className="overlay-list">
          {withdrawalHistory.map((item) => (
            <article className="withdrawal-row" key={item.id}>
              <span className="item-icon green">
                <WalletCards size={18} />
              </span>
              <div>
                <strong>{item.amount}</strong>
                <p>{item.points.toLocaleString("id-ID")} poin • {item.target}</p>
                <small>{item.requestedAt}</small>
              </div>
              <StatusBadge status={item.status} />
            </article>
          ))}
        </section>

        <PrimaryButton onClick={onOpenWithdraw}>Buat Penarikan Baru</PrimaryButton>
      </div>
    </OverlayShell>
  );
}

function NotificationsScreen({ onBack, onOpenReward }: { onBack: () => void; onOpenReward: () => void }) {
  const [allRead, setAllRead] = useState(false);

  return (
    <OverlayShell
      title="Notifikasi"
      eyebrow="Update akun"
      onBack={onBack}
      action={
        <button
          aria-label="Tandai semua notifikasi dibaca"
          className="topbar-text-action"
          onClick={() => setAllRead(true)}
        >
          Tandai
        </button>
      }
    >
      <div className="overlay-stack">
        {allRead && (
          <section className="inline-status">
            <Check size={18} />
            Semua notifikasi ditandai sudah dibaca.
          </section>
        )}
        {notificationGroups.map((group) => (
          <section className="notification-group" key={group.label}>
            <span className="overlay-section-label">{group.label}</span>
            <div className="overlay-list">
              {group.items.map((item) => (
                <article className={`notification-row ${item.tone}`} key={item.title}>
                  <span>{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <small>{item.time}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <button className="secondary-link-card" onClick={onOpenReward}>
          <Gift size={19} />
          Lihat reward yang tersedia
          <ChevronRight size={18} />
        </button>
      </div>
    </OverlayShell>
  );
}

function SupportScreen({ user, onBack }: { user: EcoUser; onBack: () => void }) {
  const [topic, setTopic] = useState("Setoran gagal");
  const [message, setMessage] = useState("QR SmartBin atau poin saya belum sesuai.");
  const [sent, setSent] = useState(false);

  return (
    <OverlayShell title="Hubungi Kami" eyebrow="Dukungan EcoDrop" onBack={onBack}>
      <div className="overlay-stack">
        <section className="support-hero">
          <span>
            <Headphones size={28} />
          </span>
          <h2>Kami bantu sampai jelas.</h2>
          <p>Pilih topik agar admin langsung melihat konteks masalah Anda.</p>
        </section>

        {sent ? (
          <section className="completion-panel">
            <span>
              <Send size={26} />
            </span>
            <h2>Tiket bantuan dibuat</h2>
            <p>Balasan akan dikirim ke {user.email}. Estimasi respons kurang dari 1 hari kerja.</p>
            <PrimaryButton onClick={onBack}>Kembali</PrimaryButton>
          </section>
        ) : (
          <>
            <section className="contact-options">
              <a href="mailto:support@ecodrop.local">
                <Mail size={18} />
                support@ecodrop.local
              </a>
              <a href="https://wa.me/6281234567890">
                <MessageCircle size={18} />
                WhatsApp Admin
              </a>
            </section>

            <section className="task-card">
              <span className="overlay-section-label">Topik</span>
              <div className="amount-chip-row support-topic-row">
                {["Setoran gagal", "QR bermasalah", "Poin belum masuk", "Penarikan"].map((item) => (
                  <button className={topic === item ? "active" : ""} type="button" key={item} onClick={() => setTopic(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <label className="overlay-field">
                <span>Pesan</span>
                <textarea value={message} onChange={(event) => setMessage(event.currentTarget.value)} rows={4} />
              </label>
            </section>

            <PrimaryButton onClick={() => setSent(true)} disabled={message.trim().length < 8}>
              Kirim Permintaan Bantuan
            </PrimaryButton>
          </>
        )}
      </div>
    </OverlayShell>
  );
}

function SmartBinsScreen({
  devices,
  onBack,
  onOpenSmartBin,
  onStartDeposit
}: {
  devices: SmartBin[];
  onBack: () => void;
  onOpenSmartBin: (device: SmartBin) => void;
  onStartDeposit: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "available">("all");
  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchesQuery = `${device.name} ${device.locationName}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "online" && device.status === "online") ||
        (filter === "available" && device.status === "online" && device.capacityPercent < 80);
      return matchesQuery && matchesFilter;
    });
  }, [devices, filter, query]);

  return (
    <OverlayShell title="Smart Bin" eyebrow="Lokasi terdekat" onBack={onBack}>
      <div className="overlay-stack">
        <label className="overlay-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Cari lokasi Smart Bin" />
        </label>
        <div className="amount-chip-row smartbin-filter-row">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} type="button">Semua</button>
          <button className={filter === "online" ? "active" : ""} onClick={() => setFilter("online")} type="button">Aktif</button>
          <button className={filter === "available" ? "active" : ""} onClick={() => setFilter("available")} type="button">Kapasitas Aman</button>
        </div>

        <section className="map-preview-card">
          <img src={figmaAssets.binMap} alt="" />
          <span>
            <LocateFixed size={18} />
          </span>
        </section>

        <section className="overlay-list">
          {filtered.map((device) => (
            <article className="smartbin-list-card" key={device.id}>
              <img src={figmaAssets.smartBinNearby} alt="" />
              <div>
                <strong>{displayBinName(device)}</strong>
                <p>
                  <MapPin size={12} />
                  {device.locationName}
                </p>
                <meter min={0} max={100} value={device.capacityPercent} />
                <small>Kapasitas {device.capacityPercent}% • {device.status === "online" ? "Aktif" : "Tidak aktif"}</small>
              </div>
              <button onClick={() => onOpenSmartBin(device)} aria-label={`Lihat ${device.name}`}>
                <ChevronRight size={18} />
              </button>
            </article>
          ))}
        </section>

        <PrimaryButton onClick={onStartDeposit}>
          <Recycle size={18} />
          Mulai Setor
        </PrimaryButton>
      </div>
    </OverlayShell>
  );
}

function RewardClaimScreen({ user, onBack }: { user: EcoUser; onBack: () => void }) {
  const [claimed, setClaimed] = useState(false);
  const hasEnoughPoints = user.points >= 5000;

  return (
    <OverlayShell title="Klaim Reward" eyebrow="Hadiah EcoDrop" onBack={onBack}>
      <div className="overlay-stack">
        <section className="reward-claim-hero">
          <img src={figmaAssets.activityRewardBanner} alt="" />
          <div>
            <span>Reward Eksklusif</span>
            <h2>Tote bag EcoDrop</h2>
            <p>Butuh 5.000 poin. Stok demo tersedia untuk anggota aktif.</p>
          </div>
        </section>

        {claimed ? (
          <section className="completion-panel">
            <span>
              <Gift size={28} />
            </span>
            <h2>Reward berhasil diklaim</h2>
            <p>Admin akan menghubungi Anda untuk pengambilan tote bag di kampus.</p>
            <PrimaryButton onClick={onBack}>Kembali</PrimaryButton>
          </section>
        ) : (
          <>
            <section className="task-card reward-requirements">
              <h2>Syarat Klaim</h2>
              <CheckLine done={hasEnoughPoints}>Minimal 5.000 poin tersedia</CheckLine>
              <CheckLine done>Profil dan kontak sudah lengkap</CheckLine>
              <CheckLine done>Reward hanya bisa diklaim satu kali per periode</CheckLine>
            </section>
            <section className="withdraw-summary">
              <span>Poin setelah klaim</span>
              <strong>{Math.max(0, user.points - 5000).toLocaleString("id-ID")} Poin</strong>
              <small>{hasEnoughPoints ? "Poin akan dikurangi setelah admin mengonfirmasi klaim." : "Poin belum cukup untuk reward ini."}</small>
            </section>
            <PrimaryButton onClick={() => setClaimed(true)} disabled={!hasEnoughPoints}>
              Klaim Reward
            </PrimaryButton>
          </>
        )}
      </div>
    </OverlayShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "paid" ? "Dibayar" : status === "approved" ? "Disetujui" : "Diproses";
  return <span className={`status-badge ${status}`}>{label}</span>;
}

function CheckLine({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <p className={done ? "check-line done" : "check-line"}>
      {done ? <Check size={15} /> : <Clock3 size={15} />}
      {children}
    </p>
  );
}

function displayBinName(device: SmartBin) {
  if (device.name.includes("Labtek")) return "Smart Bin Labtek V ITB";
  if (device.name.includes("Kantin")) return "EcoDrop ITB Kantin Barat";
  return device.name;
}
