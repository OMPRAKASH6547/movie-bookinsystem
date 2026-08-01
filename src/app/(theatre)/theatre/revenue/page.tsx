"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];

export default function RevenuePage() {
  const [preset, setPreset] = useState("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [theatres, setTheatres] = useState<any[]>([]);
  const [theatreId, setTheatreId] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/owner/theatres").then((r) => setTheatres(r.data.data || []));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (from && to) {
      params.from = from;
      params.to = to;
    } else params.preset = preset;
    if (theatreId) params.theatreId = theatreId;
    api.get("/owner/revenue", { params }).then((r) => setData(r.data.data));
  }, [preset, from, to, theatreId]);

  const m = data?.metrics || {};

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Revenue dashboard"
        subtitle="Online/offline mix, tax, refunds, occupancy"
        actions={
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={theatreId}
            onChange={(e) => setTheatreId(e.target.value)}
          >
            <option value="">All theatres</option>
            {theatres.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={!from && preset === p.id ? "default" : "outline"}
            onClick={() => {
              setFrom("");
              setTo("");
              setPreset(p.id);
            }}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">From</p>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">To</p>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total revenue" value={formatCurrency(m.totalRevenue || 0)} />
        <StatCard label="Online" value={formatCurrency(m.onlineRevenue || 0)} />
        <StatCard label="Offline / POS" value={formatCurrency(m.offlineRevenue || 0)} />
        <StatCard label="Net revenue" value={formatCurrency(m.netRevenue || 0)} />
        <StatCard label="Cash" value={formatCurrency(m.cashRevenue || 0)} />
        <StatCard label="Card" value={formatCurrency(m.cardRevenue || 0)} />
        <StatCard label="UPI" value={formatCurrency(m.upiRevenue || 0)} />
        <StatCard label="Wallet" value={formatCurrency(m.walletRevenue || 0)} />
        <StatCard label="Tax collected" value={formatCurrency(m.taxCollected || 0)} />
        <StatCard label="Refunds" value={formatCurrency(m.refundAmount || 0)} />
        <StatCard label="Occupancy" value={`${m.occupancyPercent || 0}%`} />
        <StatCard label="Avg ticket" value={formatCurrency(m.averageTicketPrice || 0)} />
        <StatCard label="Bookings" value={m.totalBookings || 0} />
        <StatCard label="Tickets sold" value={m.ticketsSold || 0} />
        <StatCard label="Available seats" value={m.availableSeats || 0} />
      </div>

      <section>
        <h2 className="font-semibold mb-3">Revenue trend</h2>
        <div className="space-y-2">
          {(data?.charts?.revenueTrend || []).map((d: any) => (
            <div key={d.date} className="flex items-center gap-3 text-sm">
              <span className="w-24 text-muted-foreground">{d.date}</span>
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.min(100, (d.revenue / Math.max(1, m.totalRevenue)) * 100 * 3)}%`,
                  }}
                />
              </div>
              <span className="w-28 text-right font-medium">{formatCurrency(d.revenue)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-semibold mb-3">Movie-wise</h2>
          {(data?.charts?.movieWise || []).map((x: any) => (
            <div key={x.id} className="flex justify-between py-2 border-b border-border text-sm">
              <span>{x.name}</span>
              <span>{formatCurrency(x.revenue)}</span>
            </div>
          ))}
        </section>
        <section>
          <h2 className="font-semibold mb-3">Theatre-wise</h2>
          {(data?.charts?.theatreWise || []).map((x: any) => (
            <div key={x.id} className="flex justify-between py-2 border-b border-border text-sm">
              <span>{x.name}</span>
              <span>{formatCurrency(x.revenue)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
