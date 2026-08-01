"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

export default function MonitoringPage() {
  const [health, setHealth] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    Promise.all([api.get("/health"), api.get("/super-admin/overview")])
      .then(([h, o]) => {
        setHealth(h.data);
        setOverview(o.data.data);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="System monitoring" subtitle="Health checks and runtime status" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="API status" value={health?.status || "—"} />
        <StatCard label="Uptime (s)" value={Math.round(health?.uptime || 0)} />
        <StatCard label="MongoDB" value={health?.checks?.mongodb || "—"} />
        <StatCard label="Redis" value={health?.checks?.redis || "—"} />
      </div>
      <div className="rounded-xl border border-border p-5 space-y-3">
        <h2 className="font-semibold">Platform workers</h2>
        {Object.entries(overview?.health || {}).map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="capitalize">{k}</span>
            <Badge variant="success">{String(v)}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
