import { Leaf, LockKeyhole } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";

type LoginScreenProps = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <section className="login-screen">
      <div className="login-brand">
        <span className="login-logo">
          <Leaf size={36} />
        </span>
        <h1>ecodrop</h1>
        <p>Setor botol plastik, pantau poin, dan bantu SmartBin bekerja lebih akurat.</p>
      </div>
      <section className="login-card">
        <LockKeyhole size={28} />
        <h2>Masuk Demo</h2>
        <p>Gunakan sesi demo untuk menjalankan alur setoran EcoDrop end-to-end.</p>
        <PrimaryButton onClick={onLogin}>Masuk sebagai Arqila</PrimaryButton>
      </section>
    </section>
  );
}
