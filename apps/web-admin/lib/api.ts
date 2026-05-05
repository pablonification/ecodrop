import {
  demoSmartBins,
  demoTransactions,
  type AdminOverview,
  type DepositTransaction,
  type SmartBin,
  type WithdrawalRequest
} from "@ecodrop/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface DashboardPayload {
  overview: AdminOverview;
  devices: SmartBin[];
  transactions: DepositTransaction[];
  withdrawals: WithdrawalRequest[];
  series: Array<{ label: string; transactions: number; volumeMl: number; points: number }>;
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, { cache: "no-store" });
    if (!response.ok) throw new Error("Dashboard API unavailable");
    const data = await response.json();
    return normalizeDashboard(data);
  } catch {
    return {
      overview: {
        totalUsers: 182,
        totalTransactions: demoTransactions.length,
        totalVolumeMl: demoTransactions.reduce((sum, trx) => sum + trx.volumeMl, 0),
        totalPointsIssued: demoTransactions.reduce((sum, trx) => sum + trx.points, 0),
        activeSmartBins: 1,
        pendingWithdrawals: 4
      },
      devices: demoSmartBins,
      transactions: demoTransactions,
      withdrawals: [
        {
          id: "wd-001",
          userId: "user-demo-001",
          userName: "Arqila Surya Putra",
          points: 5000,
          method: "ewallet",
          accountTarget: "081234567890",
          status: "pending",
          requestedAt: new Date().toISOString()
        }
      ],
      series: [
        { label: "Mon", transactions: 12, volumeMl: 7200, points: 720 },
        { label: "Tue", transactions: 18, volumeMl: 10800, points: 1080 },
        { label: "Wed", transactions: 15, volumeMl: 9000, points: 900 },
        { label: "Thu", transactions: 24, volumeMl: 14400, points: 1440 }
      ]
    };
  }
}

function normalizeDashboard(raw: any): DashboardPayload {
  return {
    overview: {
      totalUsers: raw.overview.total_users,
      totalTransactions: raw.overview.total_transactions,
      totalVolumeMl: raw.overview.total_volume_ml,
      totalPointsIssued: raw.overview.total_points_issued,
      activeSmartBins: raw.overview.active_smart_bins,
      pendingWithdrawals: raw.overview.pending_withdrawals
    },
    devices: raw.devices.map((device: any) => ({
      id: device.id,
      name: device.name,
      locationName: device.location_name,
      latitude: device.latitude,
      longitude: device.longitude,
      status: device.status,
      capacityPercent: device.capacity_percent,
      lastHeartbeatAt: device.last_heartbeat_at
    })),
    transactions: raw.transactions.map((transaction: any) => ({
      id: transaction.id,
      sessionId: transaction.session_id,
      userId: transaction.user_id,
      deviceId: transaction.device_id,
      brand: transaction.brand,
      volumeMl: transaction.volume_ml,
      points: transaction.points,
      status: transaction.status,
      failureReason: transaction.failure_reason,
      sensorConfirmedAt: transaction.sensor_confirmed_at,
      createdAt: transaction.created_at
    })),
    withdrawals: [],
    series: raw.series.map((point: any) => ({
      label: point.label,
      transactions: point.transactions,
      volumeMl: point.volume_ml,
      points: point.points
    }))
  };
}
