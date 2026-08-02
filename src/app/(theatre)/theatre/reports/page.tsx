"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";

export default function ReportsPage() {
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const [filters, setFilters] = useState({
    theatreId: "",
    paymentMethod: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    api.get("/owner/theatres").then((r) => setTheatres(r.data.data || []));
  }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/owner/reports/bookings", { params: filters });
      setRows(data.data?.rows || []);
    } catch {
      toast.error("Failed to load report");
    }
  };

  const exportCsv = async () => {
    const res = await api.get("/owner/reports/bookings", {
      params: { ...filters, format: "csv" },
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcelish = () => {
    // CSV opens in Excel; PDF via print
    exportCsv();
  };

  const printPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Booking reports"
        subtitle="Filter by theatre, payment, date · export CSV / Excel / PDF"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportExcelish}>
              Excel
            </Button>
            <Button size="sm" variant="outline" onClick={printPdf}>
              PDF
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-5 gap-3">
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
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
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={filters.paymentMethod}
          onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
        >
          <option value="">All payments</option>
          {["cash", "card", "upi", "wallet", "payu", "split"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
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
        <Button onClick={load}>Generate</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3">Booking</th>
              <th className="p-3">Theatre</th>
              <th className="p-3">Movie</th>
              <th className="p-3">Channel</th>
              <th className="p-3">Pay</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Staff</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b._id} className="border-t border-border">
                <td className="p-3">{b.bookingNumber}</td>
                <td className="p-3">{b.theatreId?.name}</td>
                <td className="p-3">{b.movieId?.title}</td>
                <td className="p-3">{b.channel}</td>
                <td className="p-3">{b.paymentMethod}</td>
                <td className="p-3">{formatCurrency(b.finalAmount)}</td>
                <td className="p-3">{b.staffId?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-6 text-sm text-muted-foreground">Generate a report to see rows.</p>
        )}
      </div>
    </div>
  );
}
