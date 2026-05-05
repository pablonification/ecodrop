import { AdminShell } from "@/components/AdminShell";
import { fetchDashboard } from "@/lib/api";

export default async function Page() {
  const payload = await fetchDashboard();
  return <AdminShell payload={payload} />;
}
