"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

export default function AdminAuditPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);

  useEffect(() => {
    api.get("/admin/audit").then((res) => setItems(res.data.data || []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" subtitle="Security and operational trail" />
      <div className="space-y-2">
        {items.map((log, i) => (
          <div key={i} className="rounded-xl border border-border p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Badge variant="outline">{log.action}</Badge>
                <span>{log.resource}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {log.userId?.email || log.details?.email || "system"} ·{" "}
                {new Date(log.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
