import { ArrowLeft, Camera, CircleHelp, Image, Lightbulb } from "lucide-react";
import { figmaAssets } from "../assets/figma";

type DepositCameraOverlayProps = {
  mode: "qr" | "bottle";
  onPrimary: () => void;
  onInvalidDemo?: () => void;
  onBack?: () => void;
  primaryLabel: string;
};

export function DepositCameraOverlay({
  mode,
  onPrimary,
  onInvalidDemo,
  onBack,
  primaryLabel
}: DepositCameraOverlayProps) {
  return (
    <section
      className={mode === "qr" ? "camera-view qr" : "camera-view bottle"}
      style={{
        backgroundImage: `url(${mode === "qr" ? figmaAssets.scanQrScreen : figmaAssets.captureBottleScreen})`
      }}
    >
      <button className="camera-top-button camera-back-button" onClick={onBack} aria-label="Kembali">
        <ArrowLeft size={25} />
      </button>
      <button className="camera-top-button camera-help-button" aria-label="Bantuan">
        <CircleHelp size={21} />
      </button>

      {mode === "qr" ? (
        <button className="camera-hotspot qr-hotspot" onClick={onPrimary} aria-label={primaryLabel}>
          <span>{primaryLabel}</span>
        </button>
      ) : (
        <>
          <button className="camera-hotspot capture-hotspot" onClick={onPrimary} aria-label={primaryLabel}>
            <Camera size={30} />
          </button>
          <button className="camera-icon-hotspot flash-hotspot" aria-label="Flash">
            <Lightbulb size={18} />
          </button>
          <button className="camera-icon-hotspot gallery-hotspot" onClick={onPrimary} aria-label="Galeri">
            <Image size={18} />
          </button>
        </>
      )}

      {mode === "bottle" && onInvalidDemo && (
        <button className="text-action light invalid-demo-action" onClick={onInvalidDemo}>
          Simulasi foto tidak valid
        </button>
      )}
    </section>
  );
}
