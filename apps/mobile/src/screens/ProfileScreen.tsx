import type { ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Headphones,
  History,
  Leaf,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Search,
  Shield,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type { EcoUser } from "@ecodrop/shared";
import { figmaAssets } from "../assets/figma";
import type { ProfileView } from "../types";

type ProfileScreenProps = {
  user: EcoUser;
  view: ProfileView;
  setView: (view: ProfileView) => void;
  onLogout: () => void;
};

export function ProfileScreen({ user, view, setView, onLogout }: ProfileScreenProps) {
  if (view !== "main") {
    return <ProfileSubView view={view} user={user} onBack={() => setView("main")} />;
  }

  return (
    <div className="screen-stack profile-screen">
      <h1 className="screen-title">Profil</h1>
      <section className="profile-identity">
        <img className="profile-avatar" src={figmaAssets.profilePhoto} alt="" />
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
      <button className="logout-button" onClick={onLogout}>
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
    <div className={`profile-subview ${view}-profile-view`}>
      <header className="profile-topbar">
        <button onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={20} />
        </button>
        <h1>{title}</h1>
      </header>
      {view === "edit" && <EditProfileView user={user} />}
      {view === "help" && <HelpView />}
      {view === "privacy" && <PrivacyView />}
    </div>
  );
}

function EditProfileView({ user }: { user: EcoUser }) {
  return (
    <form className="edit-profile-form">
      <section className="avatar-editor">
        <div className="avatar-ring">
          <img src={figmaAssets.profilePhoto} alt="" />
          <button type="button" className="avatar-edit-button" aria-label="Ubah foto profil">
            <Pencil size={13} />
          </button>
        </div>
        <span>Foto Profil</span>
      </section>

      <section className="edit-field-list">
        <ProfileField label="Nama Lengkap" defaultValue={user.name} />
        <ProfileField label="Email" defaultValue="arqilasp@ecodrop.com" readOnly icon={<Lock size={18} />} />
        <ProfileField label="Nomor Telepon" defaultValue="+62 812 3456 7890" />
        <label className="profile-field">
          <span>Lokasi</span>
          <strong className="profile-input-like">
            <MapPin size={18} />
            Bandung, Indonesia
          </strong>
        </label>
      </section>

      <section className="security-note">
        <ShieldCheck className="security-watermark" size={86} aria-hidden="true" />
        <h2>Keamanan Akun</h2>
        <p>Pastikan data Anda selalu terbaru untuk memudahkan proses penukaran reward EcoDrop.</p>
      </section>

      <footer className="profile-save-footer">
        <button type="submit" className="save-profile-button">
          Simpan Perubahan
          <Check size={20} />
        </button>
      </footer>
    </form>
  );
}

function ProfileField({
  label,
  defaultValue,
  readOnly = false,
  icon
}: {
  label: string;
  defaultValue: string;
  readOnly?: boolean;
  icon?: ReactNode;
}) {
  return (
    <label className={readOnly ? "profile-field readonly" : "profile-field"}>
      <span>{label}</span>
      <span className="profile-input-wrap">
        <input defaultValue={defaultValue} readOnly={readOnly} />
        {icon}
      </span>
    </label>
  );
}

function HelpView() {
  return (
    <div className="help-view">
      <label className="help-search">
        <Search size={18} />
        <input placeholder="Cari bantuan atau pertanyaan" />
      </label>

      <div className="help-chip-row" aria-label="Kategori bantuan">
        <button className="active">Umum</button>
        <button>Poin & Hadiah</button>
        <button>Setoran</button>
      </div>

      <section className="faq-list">
        <article className="faq-card expanded">
          <button type="button">
            <strong>Apa itu EcoDrop?</strong>
            <ChevronDown size={18} />
          </button>
          <p>
            EcoDrop adalah platform revolusioner yang memudahkan Anda untuk mendaur ulang sampah
            anorganik. Kami menghubungkan Anda dengan titik pengumpulan terdekat dan memberikan
            apresiasi berupa poin yang dapat ditukarkan dengan berbagai voucher menarik atau saldo
            digital.
          </p>
        </article>
        {["Bagaimana cara menyetor botol?", "Bagaimana cara menarik poin?", "Sampah apa saja yang bisa diterima?", "Kapan poin akan masuk?"].map(
          (question) => (
            <article className="faq-card" key={question}>
              <button type="button">
                <strong>{question}</strong>
                <ChevronDown size={18} />
              </button>
            </article>
          )
        )}
      </section>

      <section className="help-callout">
        <Headphones className="help-callout-watermark" size={156} aria-hidden="true" />
        <h2>Butuh bantuan lebih?</h2>
        <p>Tidak menemukan jawaban yang Anda cari? Hubungi tim EcoDrop untuk bantuan lebih lanjut.</p>
        <button>Hubungi Kami</button>
      </section>
    </div>
  );
}

function PrivacyView() {
  const sections = [
    {
      icon: <CircleHelp size={28} />,
      title: "Informasi yang Kami Kumpulkan",
      body: "Kami mengumpulkan informasi yang Anda berikan secara langsung saat pendaftaran:",
      items: [
        "Nama lengkap dan informasi kontak.",
        "Data lokasi untuk layanan penjemputan sampah daur ulang.",
        "Informasi transaksi dan riwayat poin EcoDrop."
      ]
    },
    {
      icon: <Leaf size={28} />,
      title: "Cara Kami Menggunakan Data",
      body: "Informasi yang terkumpul digunakan semata-mata untuk meningkatkan pengalaman Anda:",
      items: [
        "Personalisasi rute penjemputan dan layanan logistik.",
        "Verifikasi identitas dan pencegahan aktivitas penipuan.",
        "Analisis dampak lingkungan secara kolektif."
      ]
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Penyimpanan dan Keamanan Data",
      body:
        "Semua data disimpan di server terenkripsi dengan standar keamanan industri perbankan. Kami menggunakan protokol SSL/TLS untuk transmisi data dan melakukan audit keamanan berkala.",
      items: ["Kami tidak akan menjual atau menyewakan data pribadi Anda kepada pihak ketiga."]
    },
    {
      icon: <FileCheck2 size={28} />,
      title: "Hak Pengguna",
      body: "Sesuai dengan regulasi perlindungan data, Anda memiliki hak penuh untuk:",
      items: [
        "Mengakses dan meminta salinan data pribadi.",
        "Memperbarui atau mengoreksi data yang tidak akurat.",
        "Meminta penghapusan akun dan data terkait."
      ]
    },
    {
      icon: <Mail size={28} />,
      title: "Kontak",
      body: "Tim Perlindungan Data kami siap membantu Anda dengan pertanyaan apapun:",
      items: ["EcoDrop Indonesia", "Email: privacy@ecodrop.com", "Jakarta Selatan"]
    }
  ];

  return (
    <article className="privacy-view">
      <section className="privacy-hero">
        <h2>Kami menjaga data Anda dengan serius.</h2>
        <p>Terakhir diperbarui: 16 April 2026</p>
      </section>
      <p className="privacy-intro">
        Privasi Anda adalah prioritas utama kami di EcoDrop. Dokumen ini menjelaskan bagaimana kami
        mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan platform
        kami untuk membangun masa depan yang lebih hijau.
      </p>

      <section className="privacy-section-list">
        {sections.map((section, index) => (
          <article className={index === 2 ? "privacy-card highlighted" : "privacy-card"} key={section.title}>
            <header>
              <span>{section.icon}</span>
              <h3>{section.title}</h3>
            </header>
            <p>{section.body}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item}>
                  <Check size={13} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <footer className="privacy-footer">
        <p>Jika Anda memiliki pertanyaan terkait privasi, hubungi kami.</p>
        <button>
          <img src={figmaAssets.privacyContactIcon} alt="" />
          Hubungi Kami
        </button>
      </footer>
    </article>
  );
}

function ProfileRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
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
