"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AdminBookingsPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/bookings", {
      params: { status: status || undefined },
    });
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load bookings"));
  }, [status]);

  return (
    <div className="space-y-6">
      <PageHeader title="Booking management" subtitle="All platform bookings & refunds" />
      <div className="flex flex-wrap gap-2">
        {["", "confirmed", "cancelled", "pending"].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={status === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
          >
            {s || "all"}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Booking</th>
              <th className="p-3">Movie</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b._id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{b.bookingNumber}</td>
                <td className="p-3">{b.movieTitle || b.movieId?.title || "—"}</td>
                <td className="p-3">{b.userName?.name || b.userName || "—"}</td>
                <td className="p-3">{formatCurrency(b.finalAmount || 0)}</td>
                <td className="p-3">
                  <Badge variant={b.status === "confirmed" ? "success" : "outline"}>
                    {b.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">No bookings found.</p>
        )}
      </div>
    </div>
  );
}
