import {
  DEPOSIT_INSERT_WINDOW_SECONDS,
  type BottleValidation,
  type DepositSession,
  estimatePoints
} from "@ecodrop/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function createDepositSession(qrToken: string): Promise<DepositSession> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_token: qrToken, user_id: "user-demo-001" })
    });
    if (!response.ok) throw new Error("Failed to create session");
    return normalizeSession(await response.json());
  } catch {
    return {
      id: `sess-local-${Date.now()}`,
      userId: "user-demo-001",
      deviceId: qrToken,
      status: "qr_validated",
      createdAt: new Date().toISOString()
    };
  }
}

export async function validateBottle(sessionId: string, file?: File): Promise<DepositSession> {
  try {
    const form = new FormData();
    form.append("image", file ?? new Blob(["mock"], { type: "image/jpeg" }), "bottle.jpg");
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/${sessionId}/validate`, {
      method: "POST",
      body: form
    });
    if (!response.ok) throw new Error("Validation failed");
    return normalizeSession(await response.json());
  } catch {
    const validation: BottleValidation = {
      isValid: true,
      brand: "Aqua",
      confidence: 0.93,
      volumeMl: 600,
      heightMm: 215,
      diameterMm: 65,
      estimatedPoints: estimatePoints(600),
      reason: "Local mock validation while backend is offline."
    };
    return {
      id: sessionId,
      userId: "user-demo-001",
      deviceId: "ECO-SMARTBIN-001",
      status: "awaiting_insert",
      validation,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };
  }
}

export async function confirmInsert(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/${sessionId}/confirm`, {
      method: "POST"
    });
    return response.ok;
  } catch {
    return true;
  }
}

export function normalizeSession(raw: any): DepositSession {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId,
    deviceId: raw.device_id ?? raw.deviceId,
    status: raw.status,
    validation: raw.validation
      ? {
          isValid: raw.validation.is_valid ?? raw.validation.isValid,
          brand: raw.validation.brand,
          confidence: raw.validation.confidence,
          volumeMl: raw.validation.volume_ml ?? raw.validation.volumeMl,
          heightMm: raw.validation.height_mm ?? raw.validation.heightMm,
          diameterMm: raw.validation.diameter_mm ?? raw.validation.diameterMm,
          estimatedPoints: raw.validation.estimated_points ?? raw.validation.estimatedPoints,
          reason: raw.validation.reason,
          debugImageUrl: raw.validation.debug_image_url ?? raw.validation.debugImageUrl
        }
      : undefined,
    createdAt: raw.created_at ?? raw.createdAt,
    expiresAt: raw.expires_at ?? raw.expiresAt
  };
}

export { DEPOSIT_INSERT_WINDOW_SECONDS };
