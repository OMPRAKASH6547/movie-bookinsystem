import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading dashboard…</div>}>
      <DashboardClient />
    </Suspense>
  );
}
