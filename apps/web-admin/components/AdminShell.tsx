"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Database,
  Download,
  LayoutDashboard,
  MonitorDot,
  QrCode,
  Search,
  Users,
  WalletCards
} from "lucide-react";
import type { DashboardPayload } from "@/lib/api";

const modules = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "monitoring", label: "Monitoring", icon: MonitorDot },
  { id: "transactions", label: "Transactions", icon: Database },
  { id: "users", label: "Users", icon: Users },
  { id: "education", label: "Education", icon: BookOpen },
  { id: "qr", label: "QR Code", icon: QrCode },
  { id: "withdrawals", label: "Withdrawals", icon: WalletCards },
  { id: "export", label: "Export", icon: Download }
] as const;

type ModuleId = (typeof modules)[number]["id"];

export function AdminShell({ payload }: { payload: DashboardPayload }) {
  const [active, setActive] = useState<ModuleId>("dashboard");
  const maxSeries = useMemo(
    () => Math.max(...payload.series.map((point) => point.transactions), 1),
    [payload.series]
  );

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <strong>EcoDrop</strong>
            <small>Admin Dashboard</small>
          </div>
        </div>
        <nav>
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? "nav-link active" : "nav-link"}
                onClick={() => setActive(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace">
        <header className="toolbar">
          <div>
            <p className="eyebrow">II3240 EcoDrop</p>
            <h1>{modules.find((item) => item.id === active)?.label}</h1>
          </div>
          <label className="search-box">
            <Search size={18} />
            <input placeholder="Search users, devices, transactions" />
          </label>
        </header>

        {active === "dashboard" && (
          <div className="stack">
            <section className="metric-grid">
              <Metric label="Total Users" value={payload.overview.totalUsers.toLocaleString("id-ID")} />
              <Metric label="Transactions" value={payload.overview.totalTransactions.toLocaleString("id-ID")} />
              <Metric label="Volume Collected" value={`${(payload.overview.totalVolumeMl / 1000).toFixed(1)} L`} />
              <Metric label="Points Issued" value={payload.overview.totalPointsIssued.toLocaleString("id-ID")} />
            </section>
            <section className="panel">
              <div className="panel-title">
                <h2>Weekly Deposits</h2>
                <span>Mock integration data</span>
              </div>
              <div className="bar-chart">
                {payload.series.map((point) => (
                  <div key={point.label} className="bar-item">
                    <div className="bar" style={{ height: `${Math.max(16, (point.transactions / maxSeries) * 180)}px` }} />
                    <span>{point.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {active === "monitoring" && (
          <TablePanel
            title="SmartBin Monitoring"
            columns={["Device", "Location", "Status", "Capacity", "Heartbeat"]}
            rows={payload.devices.map((device) => [
              device.name,
              device.locationName,
              device.status,
              `${device.capacityPercent}%`,
              device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toLocaleString("id-ID") : "-"
            ])}
          />
        )}

        {active === "transactions" && (
          <TablePanel
            title="Deposit Transactions"
            columns={["Transaction", "Device", "Brand", "Volume", "Points", "Status"]}
            rows={payload.transactions.map((transaction) => [
              transaction.id,
              transaction.deviceId,
              transaction.brand,
              `${transaction.volumeMl} ml`,
              transaction.points.toString(),
              transaction.status
            ])}
          />
        )}

        {active === "users" && (
          <TablePanel
            title="User Management"
            columns={["Name", "Email", "Tier", "Points", "Action"]}
            rows={[
              ["Arqila Surya Putra", "arqila@example.com", "Penjelajah", "12,840", "View details"],
              ["EcoDrop Demo User", "demo@ecodrop.local", "Perintis", "1,250", "View details"]
            ]}
          />
        )}

        {active === "education" && (
          <PlaceholderModule title="Education Content" description="Create, edit, publish, and archive education articles for the mobile app." />
        )}

        {active === "qr" && (
          <PlaceholderModule title="QR Code Management" description="Generate unique SmartBin QR tokens, track usage, and deactivate compromised QR codes." />
        )}

        {active === "withdrawals" && (
          <TablePanel
            title="Withdrawal Requests"
            columns={["Request", "User", "Method", "Points", "Status"]}
            rows={payload.withdrawals.map((withdrawal) => [
              withdrawal.id,
              withdrawal.userName,
              withdrawal.method,
              withdrawal.points.toString(),
              withdrawal.status
            ])}
          />
        )}

        {active === "export" && (
          <PlaceholderModule title="Export Data" description="Prepare transaction, user, SmartBin, and withdrawal CSV exports for reporting." />
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function TablePanel({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{title}</h2>
        <span>{rows.length} rows</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlaceholderModule({ title, description }: { title: string; description: string }) {
  return (
    <section className="panel empty-module">
      <BarChart3 size={42} />
      <h2>{title}</h2>
      <p>{description}</p>
      <button>
        Open workflow
        <ChevronRight size={18} />
      </button>
    </section>
  );
}
