import { ArrowLeft, Bell, ChevronRight, CircleHelp, FileText, Mail, Pencil, Shield, UserRound } from "lucide-react";
import type { EcoUser } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import type { ProfileView } from "../types";

type ProfileScreenProps = {
  user: EcoUser;
  view: ProfileView;
  setView: (view: ProfileView) => void;
};

export function ProfileScreen({ user, view, setView }: ProfileScreenProps) {
  if (view !== "main") return <ProfileSubView view={view} user={user} onBack={() => setView("main")} />;

  return (
    <div className="screen-stack">
      <h1 className="screen-title">Profil</h1>
      <section className="profile-hero">
        <div className="profile-avatar">{initials(user.name)}</div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <span>{user.tier} Tier</span>
      </section>
      <section className="home-card profile-menu">
        <ProfileRow icon={<Pencil size={19} />} label="Edit Profil" onClick={() => setView("edit")} />
        <ProfileRow icon={<CircleHelp size={19} />} label="Bantuan" onClick={() => setView("help")} />
        <ProfileRow icon={<Shield size={19} />} label="Kebijakan Privasi" onClick={() => setView("privacy")} />
        <ProfileRow icon={<Bell size={19} />} label="Notifikasi" />
      </section>
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
