"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";

export default function CommissionPage() {
  const [tenants, setTenants] = useState<JsonRecord[]>([]);
  const [mrr, setMrr] = useState(0);

  useEffect(() => {
    api.get("/super-admin/overview").then((res) => {
      setTenants(res.data.data.tenantsList || []);
      setMrr(res.data.data.mrr || 0);
    });
  }, []);

  const estimated = tenants.reduce((s, t) => s + (t.mrr * t.commission) / 100, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Commission & billing" subtitle="Platform take-rate per tenant" />
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Platform MRR" value={formatCurrency(mrr)} />
        <StatCard label="Est. monthly commission" value={formatCurrency(estimated)} />
        <StatCard label="YTD (est.)" value={formatCurrency(estimated * 12)} />
      </div>
      <div className="space-y-3">
        {tenants.map((t) => (
          <div key={t.id} className="rounded-xl border border-border p-4 flex justify-between">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                MRR {formatCurrency(t.mrr)} · rate {t.commission}%
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-accent">
                {formatCurrency((t.mrr * t.commission) / 100)}
              </p>
              <Badge variant="outline">invoice ready</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
