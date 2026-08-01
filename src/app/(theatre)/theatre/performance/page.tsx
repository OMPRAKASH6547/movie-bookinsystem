"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { TableSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { ErrorState } from "@/components/loading/error-state";

export default function PerformancePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [theatres, setTheatres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filters, setFilters] = useState({
    theatreId: "",
    counterId: "",
    staffId: "",
    date: new Date().toISOString().slice(0, 10),
    sort: "revenue",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/owner/staff/today", { params: filters });
      setRows(data.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/owner/theatres").then((r) => setTheatres(r.data.data || []));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Staff-wise performance"
        subtitle="Who booked how many tickets · counters · online/offline status"
      />

      <div className="grid sm:grid-cols-5 gap-3">
        <Input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.theatreId}
          onChange={(e) => setFilters({ ...filters, theatreId: e.target.value })}
        >
          <option value="">All theatres</option>
          {theatres.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Counter ID"
          value={filters.counterId}
          onChange={(e) => setFilters({ ...filters, counterId: e.target.value })}
        />
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
        >
          <option value="revenue">Sort: Revenue</option>
          <option value="tickets">Sort: Tickets</option>
          <option value="name">Sort: Name</option>
        </select>
        <Button onClick={load} loading={loading} loadingText="Loading…">
          Apply
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : !rows.length ? (
        <EmptyState variant="staff" title="No staff activity" description="No sessions or bookings for this filter." />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Staff</th>
              <th className="p-3">Role</th>
              <th className="p-3">Counter</th>
              <th className="p-3">Login</th>
              <th className="p-3">Logout</th>
              <th className="p-3">Tickets</th>
              <th className="p-3">Cancels</th>
              <th className="p-3">Refund</th>
              <th className="p-3">Revenue</th>
              <th className="p-3">Avg time</th>
              <th className="p-3">Last activity</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.staffId} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.role}</td>
                <td className="p-3">{r.counterName}</td>
                <td className="p-3 whitespace-nowrap">
                  {r.loginTime ? new Date(r.loginTime).toLocaleTimeString("en-IN") : "—"}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString("en-IN") : "—"}
                </td>
                <td className="p-3">{r.ticketsBooked}</td>
                <td className="p-3">{r.ticketsCancelled}</td>
                <td className="p-3">{formatCurrency(r.refundAmount)}</td>
                <td className="p-3">{formatCurrency(r.revenueGenerated)}</td>
                <td className="p-3">{r.averageBookingTimeSec}s</td>
                <td className="p-3 whitespace-nowrap">
                  {r.lastActivity
                    ? new Date(r.lastActivity).toLocaleTimeString("en-IN")
                    : "—"}
                </td>
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
    </div>
  );
}
