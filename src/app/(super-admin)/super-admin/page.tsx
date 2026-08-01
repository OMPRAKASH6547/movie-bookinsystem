"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SuperAdminPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/super-admin/overview").then((res) => setData(res.data.data));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Platform dashboard"
        subtitle="Multi-tenant SaaS control plane"
        actions={
          <Button asChild>
            <Link href="/super-admin/tenants">Manage tenants</Link>
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tenants" value={data?.tenants || 0} />
        <StatCard label="MRR" value={formatCurrency(data?.mrr || 0)} />
        <StatCard label="Commission YTD" value={formatCurrency(data?.commissionYtd || 0)} />
        <StatCard label="Open tickets" value={data?.openTickets || 0} hint="SLA 4h" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Users" value={data?.platform?.totalUsers || 0} />
        <StatCard label="Bookings" value={data?.platform?.totalBookings || 0} />
        <StatCard label="Theatres" value={data?.platform?.totalTheatres || 0} />
        <StatCard label="Movies" value={data?.platform?.totalMovies || 0} />
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4">Tenants</h2>
        <div className="space-y-3">
          {(data?.tenantsList || []).map((t: any) => (
            <div
              key={t.id}
              className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.plan} · {t.commission}% commission
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-accent">{formatCurrency(t.mrr)}/mo</span>
                <Badge variant={t.status === "active" ? "success" : "outline"}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-2">Feature flags</h3>
          <ul className="text-sm space-y-2 text-muted-foreground">
            {(data?.flags || []).map((f: any) => (
              <li key={f.id} className="flex justify-between">
                <span>{f.label}</span>
                <Badge variant={f.enabled ? "success" : "outline"}>
                  {f.enabled ? "on" : "off"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-2">System health</h3>
          <ul className="text-sm space-y-2 text-muted-foreground">
            {Object.entries(data?.health || {}).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize">{k}</span>
                <Badge variant="success">{String(v)}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
