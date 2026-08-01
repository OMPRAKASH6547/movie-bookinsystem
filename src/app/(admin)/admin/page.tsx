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
import type { DashboardStats } from "@/types";
import { SEED_MOVIES } from "@/data/movies";

const CHART = [
  { day: "Mon", bookings: 120, revenue: 98000 },
  { day: "Tue", bookings: 145, revenue: 112000 },
  { day: "Wed", bookings: 210, revenue: 168000 },
  { day: "Thu", bookings: 180, revenue: 142000 },
  { day: "Fri", bookings: 320, revenue: 256000 },
  { day: "Sat", bookings: 410, revenue: 348000 },
  { day: "Sun", bookings: 390, revenue: 320000 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 12840,
    totalBookings: 45620,
    totalRevenue: 18450000,
    totalMovies: SEED_MOVIES.length,
    totalTheatres: 186,
    todayBookings: 342,
    todayRevenue: 428000,
    occupancyRate: 72,
  });

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data.data))
      .catch(() => {
        /* keep demo stats */
      });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Admin dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform operations at a glance</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.totalUsers.toLocaleString()} />
        <StatCard label="Movies" value={stats.totalMovies} />
        <StatCard label="Theatres" value={stats.totalTheatres} />
        <StatCard label="Occupancy" value={`${stats.occupancyRate}%`} />
        <StatCard label="Total bookings" value={stats.totalBookings.toLocaleString()} />
        <StatCard label="Revenue" value={formatCurrency(stats.totalRevenue)} />
        <StatCard label="Today bookings" value={stats.todayBookings} hint="Live" />
        <StatCard label="Today revenue" value={formatCurrency(stats.todayRevenue)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-6 h-80">
        <h2 className="font-semibold mb-4">Weekly performance</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={CHART}>
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

      <section>
        <h2 className="font-semibold mb-4">Manage catalogue</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SEED_MOVIES.slice(0, 6).map((m) => (
            <div key={m._id} className="rounded-xl border border-border p-4 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-muted-foreground text-xs mt-1">
                {m.status.replace("_", " ")} · ★ {m.rating} · {m.views.toLocaleString()} views
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
