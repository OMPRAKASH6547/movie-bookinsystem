"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/dashboard/page-header";

export default function TheatreAnalyticsPage() {
  const [data, setData] = useState<JsonRecord | null>(null);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [theatreId, setTheatreId] = useState("");
  const [detail, setDetail] = useState<JsonRecord | null>(null);

  useEffect(() => {
    api.get("/theatre/analytics").then((res) => setData(res.data.data));
    api.get("/owner/theatres").then((res) => {
      const list = res.data.data || [];
      setTheatres(list);
      if (list[0]) setTheatreId(list[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!theatreId) return;
    api
      .get("/owner/analytics/theatre", { params: { theatreId, preset: "month" } })
      .then((r) => setDetail(r.data.data))
      .catch(() => setDetail(null));
  }, [theatreId]);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Theatre analytics"
        subtitle="Revenue, occupancy, best sellers, peak hours, repeat customers"
        actions={
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={theatreId}
            onChange={(e) => setTheatreId(e.target.value)}
          >
            {theatres.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={formatCurrency(detail?.revenue || data?.totalRevenue || 0)} />
        <StatCard label="Tickets sold" value={detail?.ticketsSold || data?.totalBookings || 0} />
        <StatCard label="Occupancy" value={`${detail?.occupancy || data?.occupancyRate || 0}%`} />
        <StatCard label="Customers" value={detail?.customerCount || 0} />
      </div>

      {detail && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Best movie" value={detail.bestSellingMovie || "—"} />
          <StatCard label="Peak hours" value={detail.peakHours || "—"} />
          <StatCard label="Repeat customers" value={detail.repeatCustomers || 0} />
          <StatCard label="Avg ticket" value={formatCurrency(Math.round(data?.avgTicket || 0))} />
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.weekly || data?.charts?.revenueTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey={data?.weekly ? "day" : "date"}
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
