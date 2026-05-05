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
import type { DepositSession, DepositTransaction, SmartBin } from "@ecodrop/shared";
import {
  AUTO_DEMO_SENSOR_CONFIRM,
  DEMO_SENSOR_CONFIRM_DELAY_MS,
  DEPOSIT_INSERT_WINDOW_SECONDS,
  ENABLE_DEMO_SENSOR_CONFIRM,
  confirmInsert,
  getDepositSession,
  getTransactions,
  validateBottle
} from "../api";
import { figmaAssets } from "../assets/figma";
import { DepositCameraOverlay } from "../components/DepositCameraOverlay";
import { PrimaryButton } from "../components/PrimaryButton";
import { QrScanner, type QrScannerStatus } from "../components/QrScanner";
import { StatusCard } from "../components/StatusCard";
import type { FlowStep } from "../types";

type DepositFlowProps = {
  flow: FlowStep;
  setFlow: (flow: FlowStep) => void;
  session: DepositSession | null;
  setSession: (session: DepositSession | null) => void;
  finalTransaction: DepositTransaction | null;
  setFinalTransaction: (transaction: DepositTransaction | null) => void;
  onCreateSession: (qrToken?: string) => Promise<void>;
  onClose: () => void;
  onDone: () => void;
  devices: SmartBin[];
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
  onDone,
  devices
}: DepositFlowProps) {
  const [timer, setTimer] = useState(DEPOSIT_INSERT_WINDOW_SECONDS);
  const [isBusy, setIsBusy] = useState(false);
  const [sensorSimulationStatus, setSensorSimulationStatus] = useState<"idle" | "waiting" | "detecting">("idle");
  const [qrManual, setQrManual] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<QrScannerStatus>("idle");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const simulatedSessionRef = useRef<string | null>(null);
  const qrLiveAvailable = useMemo(
    () => typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia,
    []
  );
  const validation = session?.validation;
  const activeDevice = useMemo(
    () => devices.find((device) => device.id === session?.deviceId) ?? null,
    [devices, session]
  );
  const scanDevice = useMemo(() => devices[0] ?? activeDevice, [devices, activeDevice]);
  const smartBinLabel = useMemo(() => formatSmartBinLabel(activeDevice), [activeDevice]);
  const smartBinStatus = useMemo(() => formatSmartBinStatus(activeDevice?.status), [activeDevice]);
  const scanSmartBinLabel = useMemo(() => formatSmartBinLabel(scanDevice), [scanDevice]);
  const scanSmartBinStatus = useMemo(() => formatSmartBinStatus(scanDevice?.status), [scanDevice]);

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

  useEffect(() => {
    if (flow !== "insert" || !session || session.status !== "awaiting_insert") {
      if (flow !== "insert") {
        setSensorSimulationStatus("idle");
        simulatedSessionRef.current = null;
      }
      return;
    }
    if (!AUTO_DEMO_SENSOR_CONFIRM || simulatedSessionRef.current === session.id) return;

    simulatedSessionRef.current = session.id;
    setSensorSimulationStatus("waiting");
    const timeout = window.setTimeout(() => {
      setSensorSimulationStatus("detecting");
      void confirmSensorForDemo();
    }, DEMO_SENSOR_CONFIRM_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [flow, session?.id, session?.status]);

  useEffect(() => {
    if (flow !== "qr") return;
    setQrError(null);
  }, [flow]);

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
    try {
      const transaction = await confirmInsert(session.id);
      if (transaction?.status === "success") {
        setFinalTransaction(transaction);
        setSensorSimulationStatus("idle");
        setFlow("success");
        return;
      }
      setFlow("failed");
    } finally {
      setIsBusy(false);
    }
  }

  async function retryInvalidBottle() {
    setIsBusy(true);
    try {
      await onCreateSession(session?.deviceId);
      setFinalTransaction(null);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleQrToken(rawValue: string) {
    if (!rawValue) return;
    const resolved = resolveDeviceId(rawValue, devices);
    if (!resolved) {
      setQrError("QR Smart Bin tidak dikenali. Pastikan QR berasal dari Smart Bin EcoDrop.");
      return;
    }
    setQrError(null);
    await onCreateSession(resolved);
  }

  function handleQrClick() {
    if (!qrLiveAvailable) {
      void onCreateSession();
      return;
    }
    setQrError(null);
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
        <DepositCameraOverlay
          mode="qr"
          primaryLabel="Mulai Scan QR"
          onPrimary={handleQrClick}
          onBack={onClose}
          smartBinLabel={scanSmartBinLabel}
          smartBinStatus={scanSmartBinStatus}
          qrContent={
            qrLiveAvailable ? (
              <QrScanner active={flow === "qr"} onScan={handleQrToken} onStatusChange={setQrStatus} />
            ) : undefined
          }
          qrPanel={
            qrLiveAvailable ? (
              <div className="qr-panel-content">
                <label className="qr-input">
                  <span>Kode Smart Bin</span>
                  <input
                    value={qrManual}
                    onChange={(event) => setQrManual(event.currentTarget.value)}
                    placeholder="ECO-SMARTBIN-001"
                  />
                </label>
                {qrError && <div className="qr-error">{qrError}</div>}
                {qrStatus === "unsupported" && !qrError && (
                  <div className="qr-hint">Pemindai QR belum didukung, gunakan input manual.</div>
                )}
                {qrStatus === "error" && !qrError && (
                  <div className="qr-hint">Kamera tidak dapat diakses, gunakan input manual.</div>
                )}
                <PrimaryButton onClick={() => handleQrToken(qrManual)}>
                  Gunakan Kode
                </PrimaryButton>
              </div>
            ) : undefined
          }
        />
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
            onBack={onClose}
            smartBinLabel={smartBinLabel}
            smartBinStatus={smartBinStatus}
          />
        </>
      )}

      {flow === "detecting" && (
        <section className="detecting-view deposit-detecting">
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
        <section className="result-view deposit-detected">
          <span className="success-pill">
            <Check size={16} />
            Botol berhasil dikenali
          </span>
          <p>Poin akan ditambahkan setelah botol berhasil dimasukkan ke dalam tong.</p>
          <section className="detected-card">
            <div className="bottle-thumb">
              <img src={figmaAssets.aquaBottle} alt="" />
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
        <section className="result-view deposit-invalid">
          <StatusCard
            tone="danger"
            icon={<CircleAlert size={42} />}
            title="Botol tidak tervalidasi"
            description={validation?.reason ?? "Foto belum cukup jelas. Pastikan botol PET berada di atas kotak referensi."}
          />
          <PrimaryButton onClick={retryInvalidBottle} disabled={isBusy}>
            <RotateCcw size={18} />
            Foto Ulang
          </PrimaryButton>
          <PrimaryButton variant="ghost" onClick={onClose}>
            Kembali ke Home
          </PrimaryButton>
        </section>
      )}

      {flow === "insert" && (
        <section className="insert-view deposit-insert">
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
              <strong>{sensorSimulationStatus === "detecting" ? "Sensor mendeteksi botol" : "Poin Tertunda"}</strong>
              <p>
                {AUTO_DEMO_SENSOR_CONFIRM
                  ? sensorSimulationStatus === "detecting"
                    ? "Simulasi sensor sedang mengonfirmasi botol dan menutup tong."
                    : "Simulasi sensor akan berjalan otomatis beberapa detik setelah tong terbuka."
                  : "Poin masuk otomatis setelah sensor SmartBin mengonfirmasi botol."}
              </p>
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
          className="deposit-success"
          title="Setoran Berhasil"
          description="Botol kamu telah terdeteksi oleh sensor dan poin berhasil ditambahkan."
          transaction={finalTransaction}
          session={session}
          smartBinLabel={smartBinLabel}
          timestamp={formatTimestamp(finalTransaction?.createdAt ?? session?.updatedAt ?? session?.createdAt)}
          onPrimary={onDone}
          primaryLabel="Kembali ke Home"
          secondaryLabel="Setor Lagi"
          onSecondary={() => onCreateSession()}
        />
      )}

      {flow === "failed" && (
        <DepositResult
          tone="warning"
          className="deposit-failed"
          title="Waktu Habis"
          description={session?.failureReason ?? "Sensor tidak mendeteksi botol dalam 10 detik. Poin tidak ditambahkan."}
          transaction={finalTransaction}
          session={session}
          smartBinLabel={smartBinLabel}
          timestamp={formatTimestamp(finalTransaction?.createdAt ?? session?.updatedAt ?? session?.createdAt)}
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
  className,
  tone,
  title,
  description,
  transaction,
  session,
  smartBinLabel,
  timestamp,
  onPrimary,
  primaryLabel,
  secondaryLabel,
  onSecondary
}: {
  className?: string;
  tone: "success" | "warning";
  title: string;
  description: string;
  transaction: DepositTransaction | null;
  session: DepositSession | null;
  smartBinLabel: string;
  timestamp: string;
  onPrimary: () => void;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary: () => void;
}) {
  const validation = session?.validation;
  const points = tone === "success" ? transaction?.points ?? validation?.estimatedPoints ?? 0 : 0;
  return (
    <section className={`deposit-result ${tone} ${className ?? ""}`.trim()}>
      <div className="result-icon">{tone === "success" ? <Check size={38} /> : <X size={38} />}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="deposit-result-visual" aria-hidden="true">
        <span />
        <img src={figmaAssets.aquaBottle} alt="" />
      </div>
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
          <div>
            <small>Smart Bin</small>
            <b>{smartBinLabel}</b>
          </div>
          <div>
            <small>Waktu</small>
            <b>{timestamp}</b>
          </div>
        </div>
      </section>
      <PrimaryButton onClick={onPrimary}>{primaryLabel}</PrimaryButton>
      <PrimaryButton variant="ghost" onClick={onSecondary}>{secondaryLabel}</PrimaryButton>
    </section>
  );
}

function resolveDeviceId(rawValue: string, devices: SmartBin[]): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const matched = devices.find((device) => trimmed === device.id || trimmed.includes(device.id));
  if (matched) return matched.id;
  try {
    const url = new URL(trimmed);
    const deviceId = url.searchParams.get("device_id");
    if (deviceId) return deviceId;
  } catch {
    // Ignore invalid URLs.
  }
  if (devices.length === 0) return trimmed;
  if (/^ECO-[A-Z0-9-]+$/i.test(trimmed)) return trimmed;
  return null;
}

function formatSmartBinLabel(device: SmartBin | null): string {
  if (!device) return "Smart Bin EcoDrop";
  return device.name || device.locationName || device.id;
}

function formatSmartBinStatus(status?: SmartBin["status"]): string {
  if (!status) return "Aktif";
  if (status === "online") return "Aktif";
  if (status === "offline") return "Offline";
  if (status === "maintenance") return "Maintenance";
  return "Error";
}

function formatTimestamp(value?: string): string {
  if (!value) return "-";
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
