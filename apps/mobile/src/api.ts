import {
  DEPOSIT_INSERT_WINDOW_SECONDS,
  demoArticles,
  demoSmartBins,
  demoTransactions,
  demoUser,
  estimatePoints,
  type BottleValidation,
  type DepositSession,
  type DepositTransaction,
  type EcoUser,
  type EducationArticle,
  type SmartBin
} from "@ecodrop/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const ENABLE_DEMO_SENSOR_CONFIRM = import.meta.env.VITE_ENABLE_DEMO_SENSOR_CONFIRM !== "false";

export async function getCurrentUser(): Promise<EcoUser> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`);
    if (!response.ok) throw new Error("User API unavailable");
    return normalizeUser(await response.json());
  } catch {
    return demoUser;
  }
}

export async function getSmartBins(): Promise<SmartBin[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/devices`);
    if (!response.ok) throw new Error("Device API unavailable");
    return (await response.json()).map(normalizeSmartBin);
  } catch {
    return demoSmartBins;
  }
}

export async function getTransactions(userId = "user-demo-001"): Promise<DepositTransaction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions?user_id=${userId}`);
    if (!response.ok) throw new Error("Transaction API unavailable");
    return (await response.json()).map(normalizeTransaction);
  } catch {
    return demoTransactions;
  }
}

export async function getEducationArticles(): Promise<EducationArticle[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/education`);
    if (!response.ok) throw new Error("Education API unavailable");
    return (await response.json()).map(normalizeArticle);
  } catch {
    return demoArticles;
  }
}

export async function createDepositSession(qrToken: string): Promise<DepositSession> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr_token: qrToken, user_id: "user-demo-001" })
    });
    if (response.status === 409) {
      const activeSession = await getActiveDepositSession(qrToken);
      if (activeSession) return activeSession;
    }
    if (!response.ok) throw new Error("Failed to create session");
    return normalizeSession(await response.json());
  } catch {
    return {
      id: `sess-local-${Date.now()}`,
      userId: "user-demo-001",
      deviceId: qrToken,
      status: "qr_validated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    };
  }
}

async function getActiveDepositSession(deviceId: string): Promise<DepositSession | null> {
  const params = new URLSearchParams({
    user_id: "user-demo-001",
    device_id: deviceId
  });
  const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/active?${params.toString()}`);
  if (!response.ok) return null;
  return normalizeSession(await response.json());
}

export async function getDepositSession(sessionId: string): Promise<DepositSession | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/${sessionId}`);
    if (!response.ok) throw new Error("Deposit session unavailable");
    return normalizeSession(await response.json());
  } catch {
    return null;
  }
}

export async function validateBottle(
  sessionId: string,
  file?: File,
  options?: { forceInvalid?: boolean }
): Promise<DepositSession> {
  try {
    const form = new FormData();
    if (options?.forceInvalid) {
      form.append("image", new Blob(["invalid object"], { type: "image/jpeg" }), "invalid-object.jpg");
    } else {
      form.append("image", file ?? new Blob(["mock aqua 600 bottle"], { type: "image/jpeg" }), "aqua-600.jpg");
    }
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/${sessionId}/validate`, {
      method: "POST",
      body: form
    });
    if (!response.ok) throw new Error("Validation failed");
    return normalizeSession(await response.json());
  } catch {
    const validation = options?.forceInvalid
      ? createMockInvalidValidation()
      : createMockValidValidation();
    return {
      id: sessionId,
      userId: "user-demo-001",
      deviceId: "ECO-SMARTBIN-001",
      status: validation.isValid ? "awaiting_insert" : "rejected",
      validation,
      failureReason: validation.isValid ? undefined : validation.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      insertDeadlineAt: validation.isValid
        ? new Date(Date.now() + DEPOSIT_INSERT_WINDOW_SECONDS * 1000).toISOString()
        : undefined
    };
  }
}

export async function confirmInsert(sessionId: string): Promise<DepositTransaction | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/deposit-sessions/${sessionId}/confirm`, {
      method: "POST"
    });
    if (!response.ok) return null;
    return normalizeTransaction(await response.json());
  } catch {
    return {
      id: `trx-local-${Date.now()}`,
      sessionId,
      userId: "user-demo-001",
      deviceId: "ECO-SMARTBIN-001",
      brand: "Aqua",
      volumeMl: 600,
      points: estimatePoints(600),
      status: "success",
      sensorConfirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
  }
}

export function normalizeSession(raw: any): DepositSession {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId,
    deviceId: raw.device_id ?? raw.deviceId,
    status: raw.status,
    validation: raw.validation ? normalizeValidation(raw.validation) : undefined,
    failureReason: raw.failure_reason ?? raw.failureReason,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
    expiresAt: raw.expires_at ?? raw.expiresAt,
    insertDeadlineAt: raw.insert_deadline_at ?? raw.insertDeadlineAt
  };
}

function normalizeValidation(raw: any): BottleValidation {
  return {
    isValid: raw.is_valid ?? raw.isValid,
    brand: raw.brand,
    confidence: raw.confidence,
    volumeMl: raw.volume_ml ?? raw.volumeMl,
    heightMm: raw.height_mm ?? raw.heightMm,
    diameterMm: raw.diameter_mm ?? raw.diameterMm,
    estimatedPoints: raw.estimated_points ?? raw.estimatedPoints,
    reason: raw.reason,
    debugImageUrl: raw.debug_image_url ?? raw.debugImageUrl
  };
}

function normalizeTransaction(raw: any): DepositTransaction {
  return {
    id: raw.id,
    sessionId: raw.session_id ?? raw.sessionId,
    userId: raw.user_id ?? raw.userId,
    deviceId: raw.device_id ?? raw.deviceId,
    brand: raw.brand,
    volumeMl: raw.volume_ml ?? raw.volumeMl,
    points: raw.points,
    status: raw.status,
    failureReason: raw.failure_reason ?? raw.failureReason,
    sensorConfirmedAt: raw.sensor_confirmed_at ?? raw.sensorConfirmedAt,
    createdAt: raw.created_at ?? raw.createdAt
  };
}

function normalizeUser(raw: any): EcoUser {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    points: raw.points,
    tier: raw.tier
  };
}

function normalizeSmartBin(raw: any): SmartBin {
  return {
    id: raw.id,
    name: raw.name,
    locationName: raw.location_name ?? raw.locationName,
    latitude: raw.latitude,
    longitude: raw.longitude,
    status: raw.status,
    capacityPercent: raw.capacity_percent ?? raw.capacityPercent,
    lastHeartbeatAt: raw.last_heartbeat_at ?? raw.lastHeartbeatAt,
    firmwareVersion: raw.firmware_version ?? raw.firmwareVersion
  };
}

function normalizeArticle(raw: any): EducationArticle {
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.excerpt,
    content: raw.content,
    category: raw.category,
    publishedAt: raw.published_at ?? raw.publishedAt,
    imageUrl: raw.image_url ?? raw.imageUrl
  };
}

function createMockValidValidation(): BottleValidation {
  return {
    isValid: true,
    brand: "Aqua",
    confidence: 0.93,
    volumeMl: 600,
    heightMm: 215,
    diameterMm: 65,
    estimatedPoints: estimatePoints(600),
    reason: "Local mock validation while backend is offline."
  };
}

function createMockInvalidValidation(): BottleValidation {
  return {
    isValid: false,
    brand: "Unknown",
    confidence: 0.18,
    volumeMl: 0,
    heightMm: 0,
    diameterMm: 0,
    estimatedPoints: 0,
    reason: "Foto belum menampilkan botol PET dan kotak referensi dengan jelas."
  };
}

export { API_BASE_URL, DEPOSIT_INSERT_WINDOW_SECONDS };
