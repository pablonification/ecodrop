import type { ReactNode } from "react";
import { ArrowLeft, Camera, CircleHelp, Image, Lightbulb, Recycle } from "lucide-react";
import { figmaAssets } from "../assets/figma";

type DepositCameraOverlayProps = {
  mode: "qr" | "bottle";
  onPrimary: () => void;
  onInvalidDemo?: () => void;
  onBack?: () => void;
  primaryLabel: string;
  qrContent?: ReactNode;
  qrPanel?: ReactNode;
  smartBinLabel?: string;
  smartBinStatus?: string;
};

export function DepositCameraOverlay({
  mode,
  onPrimary,
  onInvalidDemo,
  onBack,
  primaryLabel,
  qrContent,
  qrPanel,
  smartBinLabel,
  smartBinStatus
}: DepositCameraOverlayProps) {
  return (
    <section className={mode === "qr" ? "camera-view qr" : "camera-view bottle"}>
      <div className="camera-feed" aria-hidden="true">
        {mode === "qr" ? (
          qrContent ? (
            <div className="qr-live-feed">{qrContent}</div>
          ) : (
            <div className="mock-smartbin-qr">
              <span>Taruh botol anda disini</span>
              <div className="mock-qr-code">
                {Array.from({ length: 49 }).map((_, index) => (
                  <i key={index} />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="mock-bottle-scene">
            <img className="deposit-camera-bg-texture" src={figmaAssets.depositCameraBgTexture} alt="" />
            <img className="deposit-camera-photo" src={figmaAssets.depositCameraPhoto} alt="" />
          </div>
        )}
      </div>
      <div className="camera-gradient top" />
      <div className="camera-gradient bottom" />

      <button className="round-glass top-left" onClick={onBack} aria-label="Kembali">
        {mode === "bottle" ? <img src={figmaAssets.depositBackIcon} alt="" /> : <ArrowLeft size={25} />}
      </button>
      <button className="round-glass top-right" aria-label="Bantuan">
        {mode === "bottle" ? <img src={figmaAssets.depositHelpIcon} alt="" /> : <CircleHelp size={21} />}
      </button>

      {mode === "qr" ? (
        <>
          {smartBinLabel && (
            <div className="qr-smartbin-chip">
              <Recycle size={16} />
              <div>
                <small>Smart Bin</small>
                <strong>{smartBinLabel} • {smartBinStatus ?? "Aktif"}</strong>
              </div>
            </div>
          )}
          <button className="qr-window" onClick={onPrimary} aria-label={primaryLabel}>
            <span className="scan-line" />
          </button>
          <div className="camera-copy qr-copy">
            <p>Arahkan kamera ke QR code pada Smart Bin EcoDrop untuk memulai setoran.</p>
          </div>
        </>
      ) : (
        <>
          <div className="smartbin-chip">
            <img className="smartbin-chip-icon" src={figmaAssets.depositRecycleIcon} alt="" />
            <div>
              <small>Smart Bin</small>
              <strong>{smartBinLabel ?? "Labtek V ITB"} • {smartBinStatus ?? "Aktif"}</strong>
            </div>
          </div>
          <div className="bottle-guide">
            <img className="deposit-bottle-overlay" src={figmaAssets.depositBottleOverlay} alt="" />
            <img className="deposit-reference-overlay" src={figmaAssets.depositReferenceOverlay} alt="" />
          </div>
          <div className="level-indicator" aria-hidden="true">
            <span className="level-track">
              <i />
            </span>
            <span className="level-ruler" />
          </div>
          <div className="camera-copy bottle-copy">
            <ol>
              <li>
                <span>
                  Letakkan 1 botol di atas <strong>kotak referensi hitam</strong>
                </span>
              </li>
              <li>
                <span>Pastikan kotak dan botol diposisikan pas sesuai dengan area panduan</span>
              </li>
              <li>
                <span>Ambil gambar dari atas secara tegak lurus</span>
              </li>
            </ol>
          </div>
        </>
      )}

      {mode === "qr" && qrPanel && <div className="qr-panel">{qrPanel}</div>}

      <div className="camera-actions">
        <button className="round-glass" aria-label="Flash">
          {mode === "bottle" ? <img src={figmaAssets.depositFlashIcon} alt="" /> : <Lightbulb size={18} />}
        </button>
        {mode === "bottle" ? (
          <button className="capture-shutter" onClick={onPrimary} aria-label={primaryLabel}>
            <img src={figmaAssets.depositCameraIcon} alt="" />
          </button>
        ) : (
          <span className="camera-action-spacer" aria-hidden="true" />
        )}
        <button className="round-glass" onClick={mode === "bottle" ? onPrimary : undefined} aria-label="Galeri">
          {mode === "bottle" ? <img src={figmaAssets.depositGalleryIcon} alt="" /> : <Image size={18} />}
        </button>
      </div>

      {mode === "bottle" && onInvalidDemo && (
        <button className="invalid-demo-action" onClick={onInvalidDemo}>
          Simulasi foto tidak valid
        </button>
      )}
    </section>
  );
}
