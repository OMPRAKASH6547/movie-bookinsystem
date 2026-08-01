"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";

const TENANTS = [
  { name: "CineMax India", plan: "Enterprise", mrr: 89000, status: "active" },
  { name: "ScreenBox APAC", plan: "Growth", mrr: 42000, status: "active" },
  { name: "ReelHouse EU", plan: "Starter", mrr: 12000, status: "trial" },
];

export default function SuperAdminPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Platform dashboard</h1>
        <p className="text-muted-foreground mt-1">Multi-tenant SaaS control plane</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tenants" value={48} />
        <StatCard label="MRR" value={formatCurrency(2140000)} />
        <StatCard label="Commission YTD" value={formatCurrency(18600000)} />
        <StatCard label="Open tickets" value={23} hint="SLA 4h" />
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4">Tenants</h2>
        <div className="space-y-3">
          {TENANTS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.plan} plan</p>
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
            <li className="flex justify-between"><span>Realtime seats</span><Badge variant="success">on</Badge></li>
            <li className="flex justify-between"><span>Wallet v2</span><Badge variant="success">on</Badge></li>
            <li className="flex justify-between"><span>Elasticsearch</span><Badge variant="outline">ready</Badge></li>
          </ul>
        </div>
        <div className="rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-2">System health</h3>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex justify-between"><span>API</span><Badge variant="success">healthy</Badge></li>
            <li className="flex justify-between"><span>Redis</span><Badge variant="success">healthy</Badge></li>
            <li className="flex justify-between"><span>Workers</span><Badge variant="success">3/3</Badge></li>
          </ul>
        </div>
      </section>
    </div>
  );
}
