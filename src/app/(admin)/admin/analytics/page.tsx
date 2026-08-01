"use client";

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

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/theatre/analytics")])
      .then(([s, a]) => {
        setStats(s.data.data);
        setWeekly(a.data.data.weekly || []);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Reports & analytics" subtitle="Revenue, occupancy and booking trends" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Users" value={stats?.totalUsers?.toLocaleString?.() || "—"} />
        <StatCard label="Bookings" value={stats?.totalBookings?.toLocaleString?.() || "—"} />
        <StatCard label="Revenue" value={formatCurrency(stats?.totalRevenue || 0)} />
        <StatCard label="Occupancy" value={`${stats?.occupancyRate || 0}%`} />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 h-80">
        <h2 className="font-semibold mb-4">Weekly bookings</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="bookings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
