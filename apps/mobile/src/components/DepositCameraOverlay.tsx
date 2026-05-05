import { Camera, Image, Lightbulb } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

type DepositCameraOverlayProps = {
  mode: "qr" | "bottle";
  onPrimary: () => void;
  onInvalidDemo?: () => void;
  primaryLabel: string;
};

export function DepositCameraOverlay({
  mode,
  onPrimary,
  onInvalidDemo,
  primaryLabel
}: DepositCameraOverlayProps) {
  return (
    <section className={mode === "qr" ? "camera-view qr" : "camera-view bottle"}>
      <div className="camera-gradient top" />
      <div className="camera-gradient bottom" />
      {mode === "qr" ? (
        <div className="qr-window">
          <span className="scan-line" />
        </div>
      ) : (
        <div className="bottle-guide">
          <span className="reference-plate" />
          <span className="bottle-outline" />
        </div>
      )}

      <div className="camera-copy">
        {mode === "qr" ? (
          <>
            <p>Arahkan kamera ke QR code pada Smart Bin EcoDrop untuk memulai setoran.</p>
            <small>Pastikan QR terlihat jelas dan pencahayaan cukup.</small>
          </>
        ) : (
          <>
            <ol>
              <li>Letakkan 1 botol di atas kotak referensi hitam</li>
              <li>Posisikan botol dan kotak sesuai area panduan</li>
              <li>Ambil gambar dari atas secara tegak lurus</li>
            </ol>
            <small>Smart Bin Labtek V ITB • Aktif</small>
          </>
        )}
      </div>

      <div className="camera-actions">
        <button className="round-glass" aria-label="Flash">
          <Lightbulb size={18} />
        </button>
        <PrimaryButton onClick={onPrimary} className="capture-button">
          {mode === "qr" ? <Camera size={20} /> : <Camera size={22} />}
          {primaryLabel}
        </PrimaryButton>
        <button className="round-glass" aria-label="Galeri">
          <Image size={18} />
        </button>
      </div>

      {mode === "bottle" && onInvalidDemo && (
        <button className="text-action light" onClick={onInvalidDemo}>
          Simulasi foto tidak valid
        </button>
      )}
    </section>
  );
}
