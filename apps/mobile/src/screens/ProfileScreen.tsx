import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Headphones,
  History,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Shield,
  WalletCards
} from "lucide-react";
import type { EcoUser } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import { figmaAssets } from "../assets/figma";
import type { ProfileView } from "../types";

type ProfileScreenProps = {
  user: EcoUser;
  view: ProfileView;
  setView: (view: ProfileView) => void;
};

export function ProfileScreen({ user, view, setView }: ProfileScreenProps) {
  if (view !== "main") return <ProfileSubView view={view} user={user} onBack={() => setView("main")} />;

  return (
    <div className="screen-stack profile-screen">
      <h1 className="screen-title">Profil</h1>
      <section className="profile-identity">
        <img className="profile-avatar" src={figmaAssets.profileAvatar} alt="" />
        <h2>{displayProfileName(user.name)}</h2>
        <p>{user.email}</p>
      </section>

      <section className="profile-savings-card">
        <div>
          <span>Total Tabungan</span>
          <strong>{user.points.toLocaleString("id-ID")} Poin</strong>
          <small>~ Rp {(user.points * 100).toLocaleString("id-ID")}</small>
        </div>
        <WalletCards size={21} />
        <button>Tarik Poin</button>
      </section>

      <span className="profile-section-label">Pengaturan Akun</span>
      <section className="profile-menu-list">
        <ProfileRow icon={<Pencil size={19} />} label="Edit Profil" onClick={() => setView("edit")} />
        <ProfileRow icon={<History size={19} />} label="Riwayat Penarikan" />
      </section>

      <span className="profile-section-label">Dukungan</span>
      <section className="profile-menu-list">
        <ProfileRow icon={<CircleHelp size={19} />} label="Bantuan" onClick={() => setView("help")} />
        <ProfileRow icon={<Shield size={19} />} label="Kebijakan Privasi" onClick={() => setView("privacy")} />
        <ProfileRow icon={<Bell size={19} />} label="Notifikasi" />
      </section>

      <button className="contact-button">
        <Headphones size={19} />
        Hubungi Kami
      </button>
      <button className="logout-button">
        <LogOut size={18} />
        Keluar
      </button>
      <small className="app-version">ECODROP V2.4.0</small>
    </div>
  );
}

function ProfileSubView({ view, user, onBack }: { view: ProfileView; user: EcoUser; onBack: () => void }) {
  const title = view === "edit" ? "Edit Profil" : view === "help" ? "Bantuan" : "Kebijakan Privasi";
  return (
    <div className="sub-view">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={20} />
        {title}
      </button>
      {view === "edit" && (
        <form className="form-card">
          <img className="profile-avatar edit-avatar" src={figmaAssets.profileAvatarLarge} alt="" />
          <label>
            Nama
            <input defaultValue={user.name} />
          </label>
          <label>
            Email
            <input defaultValue={user.email} />
          </label>
          <label>
            Nomor Telepon
            <input defaultValue="081234567890" />
          </label>
          <label>
            Lokasi
            <span className="input-like">
              <MapPin size={18} />
              Bandung, Indonesia
            </span>
          </label>
          <section className="security-note">
            <h2>Keamanan Akun</h2>
            <p>Pastikan data Anda selalu terbaru untuk memudahkan proses penukaran reward EcoDrop.</p>
          </section>
          <PrimaryButton>Simpan Perubahan</PrimaryButton>
        </form>
      )}
      {view === "help" && (
        <section className="home-card article-copy">
          <CircleHelp size={32} />
          <h2>Butuh bantuan?</h2>
          <p>Hubungi admin EcoDrop jika QR SmartBin tidak terbaca, setoran gagal, atau poin belum masuk.</p>
          <ProfileRow icon={<Mail size={18} />} label="support@ecodrop.local" />
        </section>
      )}
      {view === "privacy" && (
        <section className="home-card article-copy">
          <FileText size={32} />
          <h2>Kebijakan Privasi</h2>
          <p>
            EcoDrop menyimpan data akun, riwayat setoran, dan log perangkat untuk menjaga integritas
            poin. Foto botol dipakai untuk validasi AI/CV dan dapat diproses oleh layanan backend.
          </p>
          <p>Data tidak digunakan untuk menambah poin sebelum sensor SmartBin mengonfirmasi setoran fisik.</p>
        </section>
      )}
    </div>
  );
}

function ProfileRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button className="profile-row" onClick={onClick}>
      <span className="item-icon green">{icon}</span>
      <strong>{label}</strong>
      <ChevronRight size={18} />
    </button>
  );
}

function displayProfileName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
