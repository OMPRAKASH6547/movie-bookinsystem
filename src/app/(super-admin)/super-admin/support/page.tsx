"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SupportPage() {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await api.get("/super-admin/support");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load tickets"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Support tickets" subtitle="Tenant escalations and SLA tracking" />
      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-border p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{t.subject}</p>
              <p className="text-sm text-muted-foreground">
                {t.tenant} · {t.createdAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={t.priority === "high" ? "default" : "outline"}>{t.priority}</Badge>
              <Badge variant={t.status === "resolved" ? "success" : "outline"}>{t.status}</Badge>
              {t.status !== "resolved" && (
                <Button
                  size="sm"
                  onClick={async () => {
                    await api.patch("/super-admin/support", { id: t.id, status: "resolved" });
                    toast.success("Ticket resolved");
                    load();
                  }}
                >
                  Resolve
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
