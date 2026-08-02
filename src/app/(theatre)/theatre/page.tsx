"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/constants/roles";
import { defaultTheatreLanding } from "@/lib/theatre/nav";
import { useRouter } from "next/navigation";
import { DashboardPageSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { DataState } from "@/components/loading/data-state";

const COLORS = ["#c9a227", "#e11d48", "#0ea5e9", "#22c55e", "#a855f7"];

export default function TheatreDashboard() {
  const { permissions, user } = usePermissions();
  const router = useRouter();
  const [data, setData] = useState<JsonRecord | null>(null);
  const [staffToday, setStaffToday] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = async () => {
    if (!permissions.includes(PERMISSIONS.VIEW_OWNER_DASHBOARD) && user?.role !== "super_admin") {
      router.replace(defaultTheatreLanding(permissions, user?.role));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dash = await api.get("/owner/dashboard");
      setData(dash.data.data);
      if (permissions.includes(PERMISSIONS.VIEW_STAFF_PERFORMANCE)) {
        const staff = await api.get("/owner/staff/today");
        setStaffToday(staff.data.data || []);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const m = data?.metrics || {};
  const w = data?.widgets || {};

  return (
    <DataState
      loading={loading}
      error={error}
      skeleton={<DashboardPageSkeleton />}
      onRetry={load}
      isEmpty={false}
    >
      <div className="space-y-8 max-w-6xl">
        <PageHeader
          title="Today's business"
          subtitle="Live summary across your theatres"
          actions={
            <div className="flex gap-2">
              {permissions.includes(PERMISSIONS.POS_BOOK) && (
                <Button asChild variant="outline">
                  <Link href="/theatre/pos">Open POS</Link>
                </Button>
              )}
              {permissions.includes(PERMISSIONS.VIEW_THEATRE_ANALYTICS) && (
                <Button asChild>
                  <Link href="/theatre/revenue">Revenue</Link>
                </Button>
              )}
            </div>
          }
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's revenue" value={formatCurrency(m.todaysRevenue || 0)} />
          <StatCard label="Today's bookings" value={m.todaysBookings || 0} />
          <StatCard label="Tickets sold" value={m.todaysTicketsSold || 0} />
          <StatCard label="Occupancy" value={`${m.todaysOccupancy || 0}%`} />
          <StatCard label="Online revenue" value={formatCurrency(m.todaysOnlineRevenue || 0)} />
          <StatCard label="Offline revenue" value={formatCurrency(m.todaysOfflineRevenue || 0)} />
          <StatCard label="Cash collection" value={formatCurrency(m.todaysCashCollection || 0)} />
          <StatCard label="UPI collection" value={formatCurrency(m.todaysUpiCollection || 0)} />
          <StatCard label="Card collection" value={formatCurrency(m.todaysCardCollection || 0)} />
          <StatCard label="Refunds" value={formatCurrency(m.todaysRefundAmount || 0)} />
          <StatCard label="Active shows" value={m.activeShows || 0} />
          <StatCard label="Running movies" value={m.runningMovies || 0} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-border p-4 h-72">
            <h3 className="font-semibold mb-3">Revenue by hour</h3>
            {(w.revenueByHour || []).some((h: JsonRecord) => h.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={w.revenueByHour || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState variant="revenue" className="border-0 bg-transparent py-8" />
            )}
          </section>

          <section className="rounded-xl border border-border p-4 h-72">
            <h3 className="font-semibold mb-3">Payment methods</h3>
            {(w.revenueByPaymentMethod || []).length ? (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={w.revenueByPaymentMethod}
                    dataKey="amount"
                    nameKey="method"
                    outerRadius={90}
                    label
                  >
                    {(w.revenueByPaymentMethod || []).map((_: JsonRecord, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatCurrency(typeof v === "number" ? v : Number(v) || 0)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState variant="revenue" className="border-0 bg-transparent py-8" />
            )}
          </section>
        </div>

        {permissions.includes(PERMISSIONS.VIEW_STAFF_PERFORMANCE) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Staff performance today</h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/theatre/performance">Full report</Link>
              </Button>
            </div>
            {!staffToday.length ? (
              <EmptyState variant="staff" description="No staff POS activity yet today." />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Staff</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Counter</th>
                      <th className="p-3">Tickets</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffToday.slice(0, 8).map((r) => (
                      <tr key={r.staffId} className="border-t border-border">
                        <td className="p-3 font-medium">{r.name}</td>
                        <td className="p-3">{r.role}</td>
                        <td className="p-3">{r.counterName}</td>
                        <td className="p-3">{r.ticketsBooked}</td>
                        <td className="p-3">{formatCurrency(r.revenueGenerated)}</td>
                        <td className="p-3">
                          <Badge variant={r.status === "Online" ? "success" : "outline"}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </DataState>
  );
}
