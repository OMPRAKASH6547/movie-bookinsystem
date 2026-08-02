"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { TableSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { ErrorState } from "@/components/loading/error-state";
import { toast } from "sonner";

export default function CounterSalesPage() {
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [staff, setStaff] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filters, setFilters] = useState({
    from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    theatreId: "",
    staffId: "",
    counterId: "",
    shift: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/owner/collection", {
        params: { view: "sales", ...filters },
      });
      setRows(data.data?.rows || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/owner/theatres").then((r) => setTheatres(r.data.data || []));
    api
      .get("/owner/collection", { params: { view: "staff" } })
      .then((r) => setStaff(r.data.data || []))
      .catch(() => null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get("/owner/collection", {
        params: { view: "sales", format: "csv", ...filters },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "counter-sales.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const printPdf = () => window.print();

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Counter-wise ticket sales"
        subtitle="Staff · tickets · revenue · discounts · coupons · payments · cancellations"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              Excel / CSV
            </Button>
            <Button size="sm" variant="outline" onClick={printPdf}>
              PDF
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
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
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.staffId}
          onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Counter"
          value={filters.counterId}
          onChange={(e) => setFilters({ ...filters, counterId: e.target.value })}
        />
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.shift}
          onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
        >
          <option value="">All shifts</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </select>
      </div>
      <Button className="print:hidden" onClick={load}>
        Apply filters
      </Button>

      {loading ? (
        <TableSkeleton rows={6} cols={8} />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : !rows.length ? (
        <EmptyState variant="bookings" title="No counter sales in range" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Staff</th>
                <th className="p-3">Counter</th>
                <th className="p-3">Tickets</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Coupon</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Date & time</th>
                <th className="p-3">Cancel / refund</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.bookingId} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium">{r.staffName}</p>
                    <p className="text-xs text-muted-foreground">{r.bookingNumber}</p>
                  </td>
                  <td className="p-3">{r.counterId}</td>
                  <td className="p-3">{r.ticketsSold}</td>
                  <td className="p-3">{formatCurrency(r.totalRevenue)}</td>
                  <td className="p-3">{formatCurrency(r.discount)}</td>
                  <td className="p-3">{r.couponCode || "—"}</td>
                  <td className="p-3">
                    <Badge variant="outline">{r.paymentMethod || "—"}</Badge>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(r.dateTime).toLocaleString("en-IN")}
                    <p className="text-xs text-muted-foreground capitalize">{r.shift}</p>
                  </td>
                  <td className="p-3">
                    {r.status === "cancelled" ? (
                      <>
                        <Badge className="bg-destructive/15 text-destructive">Cancelled</Badge>
                        <p className="text-xs mt-1">
                          Refund {formatCurrency(r.refundAmount)}
                        </p>
                        {r.cancelReason && (
                          <p className="text-xs text-muted-foreground">{r.cancelReason}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
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
