"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function AllTheatresPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data } = await api.get("/super-admin/theatres", {
      params: status ? { status } : {},
    });
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load theatres"));
  }, [status]);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="All theatres"
        subtitle="Approve registrations, suspend venues, set commission"
        actions={
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      />

      <div className="space-y-3">
        {items.map((t) => (
          <div key={t._id} className="rounded-xl border border-border p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.city}, {t.state} · Owner: {t.ownerId?.name || "—"} ({t.ownerId?.email})
                </p>
                {t.gstNumber && (
                  <p className="text-xs text-muted-foreground mt-1">GST: {t.gstNumber}</p>
                )}
              </div>
              <Badge variant={t.status === "approved" || t.status === "active" ? "success" : "outline"}>
                {t.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {(["approved", "active", "suspended", "rejected"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api.patch("/super-admin/theatres", { id: t._id, status: s });
                    toast.success(`Theatre ${s}`);
                    load();
                  }}
                >
                  {s}
                </Button>
              ))}
              <form
                className="flex gap-2 items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await api.patch("/super-admin/theatres", {
                    id: t._id,
                    commissionRate: Number(fd.get("rate")),
                  });
                  toast.success("Commission updated");
                  load();
                }}
              >
                <Input
                  name="rate"
                  type="number"
                  defaultValue={t.commissionRate ?? 10}
                  className="w-20 h-9"
                  min={0}
                  max={50}
                />
                <Button size="sm" type="submit">
                  Set %
                </Button>
              </form>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="text-muted-foreground text-sm">No theatres found for this filter.</p>
        )}
      </div>
    </div>
  );
}
