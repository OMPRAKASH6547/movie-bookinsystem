"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export default function PlatformRevenuePage() {
  const [preset, setPreset] = useState("month");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/super-admin/revenue", { params: { preset } }).then((r) => setData(r.data.data));
  }, [preset]);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Platform revenue"
        subtitle="Gross bookings, commission, and theatre breakdown"
        actions={
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={preset === p.id ? "default" : "outline"}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Gross revenue" value={formatCurrency(data?.grossRevenue || 0)} />
        <StatCard label="Net revenue" value={formatCurrency(data?.netRevenue || 0)} />
        <StatCard label="Commission" value={formatCurrency(data?.platformCommission || 0)} />
        <StatCard label="Tax collected" value={formatCurrency(data?.taxCollected || 0)} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Owners" value={data?.owners || 0} />
        <StatCard label="Theatres" value={data?.theatres || 0} />
        <StatCard label="Bookings" value={data?.totalBookings || 0} />
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4">Theatre breakdown</h2>
        <div className="space-y-2">
          {(data?.theatreBreakdown || []).map((t: any) => (
            <div
              key={t.id}
              className="rounded-xl border border-border p-4 flex justify-between gap-3"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.tickets} bookings</p>
              </div>
              <p className="font-semibold text-accent">{formatCurrency(t.revenue)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
