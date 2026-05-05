export type UserRole = "user" | "admin" | "technician";

export type SmartBinStatus = "online" | "offline" | "maintenance" | "error";

export type DepositSessionStatus =
  | "created"
  | "qr_validated"
  | "image_uploaded"
  | "validating"
  | "validated"
  | "rejected"
  | "awaiting_insert"
  | "sensor_confirmed"
  | "completed"
  | "failed"
  | "expired";

export type TransactionStatus = "success" | "failed" | "pending" | "rejected";

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";

export type BottleBrand =
  | "Aqua"
  | "Le Minerale"
  | "Cleo"
  | "Vit"
  | "Pristine"
  | "Unknown";

export interface EcoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  tier: "Perintis" | "Penjelajah" | "Panutan" | "Pewaris";
}

export interface SmartBin {
  id: string;
  name: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status: SmartBinStatus;
  capacityPercent: number;
  lastHeartbeatAt?: string;
  firmwareVersion?: string;
}

export interface BottleValidation {
  isValid: boolean;
  brand: BottleBrand;
  confidence: number;
  volumeMl: number;
  heightMm: number;
  diameterMm: number;
  estimatedPoints: number;
  reason?: string;
  debugImageUrl?: string;
}

export interface DepositSession {
  id: string;
  userId: string;
  deviceId: string;
  status: DepositSessionStatus;
  validation?: BottleValidation;
  failureReason?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  insertDeadlineAt?: string;
}

export interface DepositTransaction {
  id: string;
  sessionId: string;
  userId: string;
  deviceId: string;
  brand: BottleBrand;
  volumeMl: number;
  points: number;
  status: TransactionStatus;
  failureReason?: string;
  sensorConfirmedAt?: string;
  createdAt: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "recycling" | "lifestyle" | "plastic" | "campaign";
  publishedAt: string;
  imageUrl?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  points: number;
  method: "bank_transfer" | "ewallet";
  accountTarget: string;
  status: WithdrawalStatus;
  requestedAt: string;
}

export interface CreateWithdrawalRequest {
  userId: string;
  points: number;
  method: "bank_transfer" | "ewallet";
  accountTarget: string;
}

export interface UpdateWithdrawalStatusRequest {
  status: WithdrawalStatus;
}

export interface CreateEducationArticleRequest {
  title: string;
  excerpt: string;
  content: string;
  category: "recycling" | "lifestyle" | "plastic" | "campaign";
  imageUrl?: string;
}

export interface UpdateEducationArticleRequest {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: "recycling" | "lifestyle" | "plastic" | "campaign";
  imageUrl?: string;
}

export interface AdminOverview {
  totalUsers: number;
  totalTransactions: number;
  totalVolumeMl: number;
  totalPointsIssued: number;
  activeSmartBins: number;
  pendingWithdrawals: number;
}

export interface DashboardSeriesPoint {
  label: string;
  transactions: number;
  volumeMl: number;
  points: number;
}

export interface SmartBinCommand {
  id: string;
  deviceId: string;
  action: "open_lid" | "close_lid" | "noop";
  sessionId?: string;
  durationSeconds: number;
  status: "queued" | "sent" | "acknowledged" | "failed";
  createdAt: string;
  acknowledgedAt?: string;
  message?: string;
  metadata: Record<string, string>;
}

export interface IoTLog {
  id: string;
  deviceId: string;
  eventType:
    | "device_registered"
    | "heartbeat"
    | "command_queued"
    | "command_sent"
    | "command_acknowledged"
    | "command_failed"
    | "sensor_detected"
    | "sensor_ignored"
    | "session_failed";
  message: string;
  sessionId?: string;
  commandId?: string;
  createdAt: string;
}

export interface AdminDashboardResponse {
  overview: AdminOverview;
  devices: SmartBin[];
  transactions: DepositTransaction[];
  series: DashboardSeriesPoint[];
  iotLogs: IoTLog[];
}

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export const DEPOSIT_INSERT_WINDOW_SECONDS = 10;

export const POINTS_PER_100ML = 10;

export function estimatePoints(volumeMl: number): number {
  return Math.max(0, Math.round((volumeMl / 100) * POINTS_PER_100ML));
}

export const demoUser: EcoUser = {
  id: "user-demo-001",
  name: "Arqila Surya Putra",
  email: "arqila@example.com",
  role: "user",
  points: 12840,
  tier: "Penjelajah"
};

export const demoSmartBins: SmartBin[] = [
  {
    id: "ECO-SMARTBIN-001",
    name: "EcoDrop ITB Kantin Barat",
    locationName: "Kantin Barat ITB",
    latitude: -6.8915,
    longitude: 107.6107,
    status: "online",
    capacityPercent: 42,
    lastHeartbeatAt: new Date().toISOString(),
    firmwareVersion: "0.1.0"
  },
  {
    id: "ECO-SMARTBIN-002",
    name: "EcoDrop Labtek V",
    locationName: "Labtek V",
    latitude: -6.8908,
    longitude: 107.6098,
    status: "maintenance",
    capacityPercent: 78,
    lastHeartbeatAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  }
];

export const demoArticles: EducationArticle[] = [
  {
    id: "edu-001",
    title: "Why PET Bottles Should Be Separated",
    excerpt: "Clean PET bottles are easier to recycle and preserve material value.",
    content:
      "PET bottles should be emptied, lightly rinsed, and separated from mixed waste before recycling. EcoDrop focuses on PET bottles for the first prototype because they are common, visually recognizable, and suitable for reward-based collection.",
    category: "plastic",
    publishedAt: "2026-04-20T08:00:00.000Z"
  },
  {
    id: "edu-002",
    title: "How EcoDrop Validates Deposits",
    excerpt: "EcoDrop combines camera-based validation with SmartBin sensor confirmation.",
    content:
      "The app validates a bottle photo first, then the SmartBin opens only when the backend accepts the result. Points are granted after the IR sensor confirms the bottle entered the bin.",
    category: "recycling",
    publishedAt: "2026-04-22T08:00:00.000Z"
  }
];

export const demoTransactions: DepositTransaction[] = [
  {
    id: "trx-001",
    sessionId: "sess-001",
    userId: "user-demo-001",
    deviceId: "ECO-SMARTBIN-001",
    brand: "Aqua",
    volumeMl: 600,
    points: estimatePoints(600),
    status: "success",
    sensorConfirmedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString()
  },
  {
    id: "trx-002",
    sessionId: "sess-002",
    userId: "user-demo-001",
    deviceId: "ECO-SMARTBIN-001",
    brand: "Unknown",
    volumeMl: 0,
    points: 0,
    status: "failed",
    failureReason: "Bottle was not inserted before the 10 second timer expired.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
  },
  {
    id: "trx-003",
    sessionId: "sess-003",
    userId: "user-demo-001",
    deviceId: "ECO-SMARTBIN-002",
    brand: "Aqua",
    volumeMl: 1500,
    points: estimatePoints(1500),
    status: "success",
    sensorConfirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 12).toISOString()
  }
];
