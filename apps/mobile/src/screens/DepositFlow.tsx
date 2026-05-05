import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Cpu,
  DoorOpen,
  LoaderCircle,
  RotateCcw,
  TimerReset,
  X
} from "lucide-react";
import type { DepositSession, DepositTransaction } from "@ecodrop/shared";
import {
  DEPOSIT_INSERT_WINDOW_SECONDS,
  ENABLE_DEMO_SENSOR_CONFIRM,
  confirmInsert,
  getDepositSession,
  getTransactions,
  validateBottle
} from "../api";
import { DepositCameraOverlay } from "../components/DepositCameraOverlay";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusCard } from "../components/StatusCard";
import type { FlowStep } from "../types";

type DepositFlowProps = {
  flow: FlowStep;
  setFlow: (flow: FlowStep) => void;
  session: DepositSession | null;
  setSession: (session: DepositSession | null) => void;
  finalTransaction: DepositTransaction | null;
  setFinalTransaction: (transaction: DepositTransaction | null) => void;
  onCreateSession: () => Promise<void>;
  onClose: () => void;
  onDone: () => void;
};

export function DepositFlow({
  flow,
  setFlow,
  session,
  setSession,
  finalTransaction,
  setFinalTransaction,
  onCreateSession,
  onClose,
  onDone
}: DepositFlowProps) {
  const [timer, setTimer] = useState(DEPOSIT_INSERT_WINDOW_SECONDS);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validation = session?.validation;

  useEffect(() => {
    if (flow !== "insert" || !session) return;
    const deadline = session.insertDeadlineAt ? new Date(session.insertDeadlineAt).getTime() : Date.now() + 10000;
    const tick = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimer(remaining);
      if (remaining <= 0) {
        window.clearInterval(tick);
        setFlow("failed");
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [flow, session, setFlow]);

  useEffect(() => {
    if (flow !== "insert" || !session) return;
    const poll = window.setInterval(async () => {
      const updated = await getDepositSession(session.id);
      if (!updated) return;
      setSession(updated);
      if (updated.status === "completed") {
        const transactions = await getTransactions(updated.userId);
        const transaction = transactions.find((item) => item.sessionId === updated.id) ?? null;
        setFinalTransaction(transaction);
        setFlow("success");
      }
      if (updated.status === "failed" || updated.status === "expired" || updated.status === "rejected") {
        setFlow("failed");
      }
    }, 1500);
    return () => window.clearInterval(poll);
  }, [flow, session, setFinalTransaction, setFlow, setSession]);

  async function validateCurrentBottle(file?: File, forceInvalid = false) {
    if (!session) return;
    setIsBusy(true);
    setFlow("detecting");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const validated = await validateBottle(session.id, file, { forceInvalid });
    setSession(validated);
    setIsBusy(false);
    setFlow(validated.validation?.isValid ? "detected" : "invalid");
  }

  async function confirmSensorForDemo() {
    if (!session) return;
    setIsBusy(true);
    const transaction = await confirmInsert(session.id);
    setIsBusy(false);
    if (transaction?.status === "success") {
      setFinalTransaction(transaction);
      setFlow("success");
      return;
    }
    setFlow("failed");
  }

  const title = useMemo(() => {
    const titles: Record<FlowStep, string> = {
      idle: "Setor",
      qr: "Scan QR",
      capture: "Setor Botol",
      detecting: "Deteksi Botol",
      detected: "Botol Terdeteksi",
      invalid: "Botol Tidak Tervalidasi",
      insert: "Masukkan Botol",
      success: "Setoran Berhasil",
      failed: "Setoran Gagal"
    };
    return titles[flow];
  }, [flow]);

  return (
    <section className={flow === "qr" || flow === "capture" ? "flow-screen camera-mode" : "flow-screen"}>
      {flow !== "qr" && flow !== "capture" && (
        <header className="flow-header">
          <button className="icon-button" onClick={onClose} aria-label="Kembali">
            <ArrowLeft size={21} />
          </button>
          <h1>{title}</h1>
          <span />
        </header>
      )}

      {flow === "qr" && (
        <DepositCameraOverlay mode="qr" primaryLabel="Simulasikan Scan QR" onPrimary={onCreateSession} />
      )}

      {flow === "capture" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(event) => validateCurrentBottle(event.currentTarget.files?.[0])}
          />
          <DepositCameraOverlay
            mode="bottle"
            primaryLabel="Ambil Foto Botol"
            onPrimary={() => fileInputRef.current?.click()}
            onInvalidDemo={() => validateCurrentBottle(undefined, true)}
          />
        </>
      )}

      {flow === "detecting" && (
        <section className="detecting-view">
          <div className="ai-orb">
            <Cpu size={64} />
            <LoaderCircle size={210} className="spin-ring" />
          </div>
          <h2>Hampir Selesai...</h2>
          <p>Sedang memproses foto botol dan kotak referensi untuk menghitung estimasi poin.</p>
          <div className="processing-list">
            <span>Mendeteksi botol</span>
            <span>Membaca kotak referensi</span>
            <strong>Menghitung dimensi dan poin</strong>
          </div>
        </section>
      )}

      {flow === "detected" && validation && (
        <section className="result-view">
          <span className="success-pill">
            <Check size={16} />
            Botol berhasil dikenali
          </span>
          <p>Poin akan ditambahkan setelah botol berhasil dimasukkan ke dalam tong.</p>
          <section className="detected-card">
            <div className="bottle-thumb">
              <span className="bottle-outline small" />
            </div>
            <div className="result-grid">
              <div>
                <span>Brand Terdeteksi</span>
                <strong>{validation.brand}</strong>
              </div>
              <div>
                <span>Ukuran Estimasi</span>
                <strong>{validation.volumeMl} mL</strong>
              </div>
              <div className="points-preview">
                <span>Poin Akan Ditambah</span>
                <strong>+{validation.estimatedPoints} Poin</strong>
              </div>
            </div>
          </section>
          <PrimaryButton onClick={() => setFlow("insert")}>Lanjut Masukkan Botol</PrimaryButton>
          <button className="text-action" onClick={() => setFlow("capture")}>
            Bukan botol ini? Scan ulang
          </button>
        </section>
      )}

      {flow === "invalid" && (
        <section className="result-view">
          <StatusCard
            tone="danger"
            icon={<CircleAlert size={42} />}
            title="Botol tidak tervalidasi"
            description={validation?.reason ?? "Foto belum cukup jelas. Pastikan botol PET berada di atas kotak referensi."}
          />
          <PrimaryButton onClick={() => setFlow("capture")}>
            <RotateCcw size={18} />
            Foto Ulang
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={onClose}>
            Kembali ke Home
          </PrimaryButton>
        </section>
      )}

      {flow === "insert" && (
        <section className="insert-view">
          <span className="success-pill">
            <DoorOpen size={16} />
            Tong terbuka
          </span>
          <h2>Masukkan botol ke dalam tong</h2>
          <p>Sensor akan mendeteksi botol dalam 10 detik.</p>
          <div className="countdown">
            <strong>{timer}</strong>
            <span>Detik</span>
          </div>
          <section className="pending-card">
            <TimerReset size={28} />
            <div>
              <strong>Poin Tertunda</strong>
              <p>Poin masuk otomatis setelah sensor SmartBin mengonfirmasi botol.</p>
            </div>
          </section>
          {ENABLE_DEMO_SENSOR_CONFIRM && (
            <PrimaryButton onClick={confirmSensorForDemo} disabled={isBusy}>
              Simulasi Sensor Terdeteksi
            </PrimaryButton>
          )}
          <button className="text-action" onClick={onClose}>Batal</button>
        </section>
      )}

      {flow === "success" && (
        <DepositResult
          tone="success"
          title="Setoran Berhasil"
          description="Botol kamu telah terdeteksi oleh sensor dan poin berhasil ditambahkan."
          transaction={finalTransaction}
          session={session}
          onPrimary={onDone}
          primaryLabel="Kembali ke Home"
          secondaryLabel="Setor Lagi"
          onSecondary={onCreateSession}
        />
      )}

      {flow === "failed" && (
        <DepositResult
          tone="warning"
          title="Waktu Habis"
          description={session?.failureReason ?? "Sensor tidak mendeteksi botol dalam 10 detik. Poin tidak ditambahkan."}
          transaction={finalTransaction}
          session={session}
          onPrimary={() => setFlow("qr")}
          primaryLabel="Scan Ulang"
          secondaryLabel="Kembali ke Home"
          onSecondary={onClose}
        />
      )}
    </section>
  );
}

function DepositResult({
  tone,
  title,
  description,
  transaction,
  session,
  onPrimary,
  primaryLabel,
  secondaryLabel,
  onSecondary
}: {
  tone: "success" | "warning";
  title: string;
  description: string;
  transaction: DepositTransaction | null;
  session: DepositSession | null;
  onPrimary: () => void;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary: () => void;
}) {
  const validation = session?.validation;
  const points = tone === "success" ? transaction?.points ?? validation?.estimatedPoints ?? 0 : 0;
  return (
    <section className={`deposit-result ${tone}`}>
      <div className="result-icon">{tone === "success" ? <Check size={38} /> : <X size={38} />}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <section className="result-summary-card">
        <strong className="points-total">+{points} Poin</strong>
        <span>{tone === "success" ? "Berhasil Ditambahkan" : "Poin Batal Ditambahkan"}</span>
        <div className="summary-grid">
          <div>
            <small>Brand</small>
            <b>{transaction?.brand ?? validation?.brand ?? "Unknown"}</b>
          </div>
          <div>
            <small>Volume</small>
            <b>{transaction?.volumeMl ?? validation?.volumeMl ?? 0} mL</b>
          </div>
        </div>
      </section>
      <PrimaryButton onClick={onPrimary}>{primaryLabel}</PrimaryButton>
      <PrimaryButton variant="ghost" onClick={onSecondary}>{secondaryLabel}</PrimaryButton>
    </section>
  );
}
