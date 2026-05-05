import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, QrCode, Recycle, Upload, X } from "lucide-react";
import type { EcoUser } from "@ecodrop/shared";
import { PrimaryButton } from "../components/PrimaryButton";
import { QrScanner, type QrScannerStatus } from "../components/QrScanner";
import type { WithdrawStep } from "../types";

const MAX_QRIS_FILE_SIZE_MB = 5;

type WithdrawFlowProps = {
  user: EcoUser;
  step: WithdrawStep;
  setStep: (step: WithdrawStep) => void;
  onClose: () => void;
  onDone: () => void;
};

export function WithdrawFlow({ user, step, setStep, onClose, onDone }: WithdrawFlowProps) {
  const [amount, setAmount] = useState(0);
  const [qrisDetected, setQrisDetected] = useState(false);
  const [qrisStatus, setQrisStatus] = useState<QrScannerStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [receiptId, setReceiptId] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");

  const maxPoints = user.points;
  const isAmountValid = amount > 0 && amount <= maxPoints;
  const rupiahValue = useMemo(() => amount * 100, [amount]);
  const qrisHelp = qrisStatus === "unsupported" || qrisStatus === "error"
    ? "Gunakan unggah QRIS jika kamera tidak tersedia."
    : "Arahkan kamera ke QRIS untuk memulai penarikan.";

  useEffect(() => {
    if (step !== "success" && step !== "failed") return;
    setReceiptId(createReceiptId());
    setSubmittedAt(formatTimestamp(new Date().toISOString()));
  }, [step]);

  function resetFlow() {
    setAmount(0);
    setQrisDetected(false);
    setStep("amount");
  }

  function startQrStep() {
    if (!isAmountValid) return;
    setStep("qris");
  }

  function handleScan(value: string) {
    if (!value) return;
    setQrisDetected(true);
  }

  function handleFileUpload(file?: File) {
    if (!file) return;
    if (file.size > MAX_QRIS_FILE_SIZE_MB * 1024 * 1024) return;
    setQrisDetected(true);
  }

  if (step === "success" || step === "failed") {
    const isSuccess = step === "success";
    return (
      <section className={`withdraw-result ${isSuccess ? "success" : "failed"}`}>
        <div className="result-icon">
          {isSuccess ? <Recycle size={40} /> : <X size={38} />}
        </div>
        <h2>{isSuccess ? "Penarikan Berhasil" : "Penarikan Gagal"}</h2>
        <p>
          {isSuccess
            ? "Permintaan QRIS berhasil dikonfirmasi. Dana akan diproses otomatis."
            : "QRIS tidak dapat dikonfirmasi. Silakan coba ulang penarikan."}
        </p>
        <section className="result-summary-card">
          <strong className="points-total">-{amount} Poin</strong>
          <span>{isSuccess ? "Akan Diproses" : "Tidak Diproses"}</span>
          <div className="summary-grid">
            <div>
              <small>Metode</small>
              <b>QRIS</b>
            </div>
            <div>
              <small>Nilai Rupiah</small>
              <b>Rp {rupiahValue.toLocaleString("id-ID")}</b>
            </div>
          </div>
        </section>
        {isSuccess && (
          <section className="withdraw-receipt">
            <div>
              <small>ID Referensi</small>
              <strong>{receiptId}</strong>
            </div>
            <div>
              <small>Waktu</small>
              <strong>{submittedAt}</strong>
            </div>
          </section>
        )}
        <PrimaryButton onClick={onDone}>Kembali ke Home</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={resetFlow}>Tarik Lagi</PrimaryButton>
      </section>
    );
  }

  if (step === "qris") {
    return (
      <section className="withdraw-flow">
        <header className="flow-header">
          <button
            className="icon-button"
            onClick={() => {
              setQrisDetected(false);
              setStep("amount");
            }}
            aria-label="Kembali"
          >
            <ArrowLeft size={21} />
          </button>
          <h1>QRIS</h1>
          <span />
        </header>

        <div className="withdraw-card">
          <div className="withdraw-card-header">
            <QrCode size={20} />
            <div>
              <strong>Scan QRIS</strong>
              <span>{qrisHelp}</span>
            </div>
          </div>
          <div className="qris-scan-window">
            <QrScanner active={step === "qris"} onScan={handleScan} onStatusChange={setQrisStatus} />
            <span className="scan-line" />
          </div>
          <div className={qrisDetected ? "qris-status success" : "qris-status"}>
            <strong>{qrisDetected ? "QRIS terdeteksi" : "Menunggu QRIS"}</strong>
            <span>{qrisDetected ? "Lanjutkan untuk konfirmasi penarikan." : "Scan atau unggah QRIS terlebih dahulu."}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(event) => handleFileUpload(event.currentTarget.files?.[0])}
          />
          <PrimaryButton variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            Unggah QRIS
          </PrimaryButton>
        </div>

        <div className="withdraw-actions">
          <PrimaryButton onClick={() => setStep("success")} disabled={!qrisDetected}>
            Simulasi Berhasil
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={() => setStep("failed")} disabled={!qrisDetected}>
            Simulasi Gagal
          </PrimaryButton>
          <button className="text-action" onClick={onClose}>Batal</button>
        </div>
      </section>
    );
  }

  return (
    <section className="withdraw-flow">
      <header className="flow-header">
        <button className="icon-button" onClick={onClose} aria-label="Kembali">
          <ArrowLeft size={21} />
        </button>
        <h1>Tarik Poin</h1>
        <span />
      </header>

      <div className="withdraw-card">
        <div className="withdraw-balance">
          <span>Saldo tersedia</span>
          <strong>{maxPoints.toLocaleString("id-ID")} Poin</strong>
          <small>≈ Rp {(maxPoints * 100).toLocaleString("id-ID")}</small>
        </div>
        <label className="withdraw-input">
          <span>Jumlah poin</span>
          <input
            type="number"
            min={0}
            max={maxPoints}
            value={amount ? amount : ""}
            onChange={(event) => setAmount(Number(event.currentTarget.value))}
            placeholder="Masukkan jumlah poin"
          />
          <small>Maksimum {maxPoints.toLocaleString("id-ID")} poin.</small>
        </label>
      </div>

      <div className="withdraw-card">
        <div className="withdraw-card-header">
          <QrCode size={20} />
          <div>
            <strong>Metode penarikan</strong>
            <span>QRIS</span>
          </div>
        </div>
        <div className="withdraw-method">
          <div className="method-icon">
            <QrCode size={18} />
          </div>
          <div>
            <strong>QRIS</strong>
            <span>Scan QRIS atau unggah foto QRIS</span>
          </div>
          <Check size={20} />
        </div>
        <div className="withdraw-summary">
          <span>Estimasi nilai</span>
          <strong>Rp {rupiahValue.toLocaleString("id-ID")}</strong>
        </div>
      </div>

      <div className="withdraw-actions">
        <PrimaryButton onClick={startQrStep} disabled={!isAmountValid}>
          Lanjutkan
        </PrimaryButton>
        <button className="text-action" onClick={onClose}>Batal</button>
      </div>
    </section>
  );
}

function createReceiptId(): string {
  const seed = Math.floor(Math.random() * 900000 + 100000);
  return `WD-${seed}`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
