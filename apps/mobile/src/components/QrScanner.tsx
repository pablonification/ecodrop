import { useEffect, useRef, useState } from "react";

export type QrScannerStatus = "idle" | "starting" | "ready" | "unsupported" | "error";

type QrScannerProps = {
  active: boolean;
  onScan: (value: string) => void;
  onStatusChange?: (status: QrScannerStatus) => void;
};

type DetectedBarcode = {
  rawValue: string;
};

declare global {
  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
    static getSupportedFormats?: () => Promise<string[]>;
  }
}

export function QrScanner({ active, onScan, onStatusChange }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<QrScannerStatus>("idle");

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: BarcodeDetector | null = null;
    let rafId: number | null = null;
    let hasScanned = false;

    async function stopCamera() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    }

    async function startCamera() {
      if (!active) return;
      if (!("mediaDevices" in navigator) || typeof BarcodeDetector === "undefined") {
        setStatus("unsupported");
        return;
      }
      setStatus("starting");
      try {
        detector = new BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (cancelled) {
          await stopCamera();
          return;
        }
        const video = videoRef.current;
        if (!video) {
          await stopCamera();
          return;
        }
        video.srcObject = stream;
        await video.play();
        setStatus("ready");

        const scan = async () => {
          if (!detector || !video || cancelled || hasScanned) return;
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0) {
              hasScanned = true;
              onScan(barcodes[0].rawValue);
              await stopCamera();
              return;
            }
          } catch {
            setStatus("error");
          }
          rafId = requestAnimationFrame(scan);
        };

        rafId = requestAnimationFrame(scan);
      } catch {
        setStatus("error");
        await stopCamera();
      }
    }

    if (active) {
      void startCamera();
    } else {
      setStatus("idle");
      void stopCamera();
    }

    return () => {
      cancelled = true;
      void stopCamera();
    };
  }, [active, onScan]);

  return (
    <div className="qr-scanner">
      <video ref={videoRef} className="qr-video" muted playsInline />
      {status === "unsupported" && (
        <div className="qr-fallback">
          <strong>Pemindai QR tidak tersedia</strong>
          <span>Gunakan kode Smart Bin secara manual.</span>
        </div>
      )}
      {status === "error" && (
        <div className="qr-fallback">
          <strong>Kamera tidak dapat diakses</strong>
          <span>Periksa izin kamera atau gunakan input manual.</span>
        </div>
      )}
    </div>
  );
}
