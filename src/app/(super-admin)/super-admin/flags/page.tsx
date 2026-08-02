"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function FlagsPage() {
  const [flags, setFlags] = useState<JsonRecord[]>([]);

  const load = async () => {
    const { data } = await api.get("/super-admin/flags");
    setFlags(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load flags"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Feature flags" subtitle="Roll out platform capabilities safely" />
      <div className="space-y-3">
        {flags.map((f) => (
          <div key={f.id} className="rounded-xl border border-border p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{f.label}</p>
              <p className="text-sm text-muted-foreground">{f.description}</p>
              <p className="text-xs font-mono mt-1 text-muted-foreground">{f.key}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={f.enabled ? "success" : "outline"}>
                {f.enabled ? "on" : "off"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await api.patch("/super-admin/flags", { id: f.id });
                  toast.success("Flag updated");
                  load();
                }}
              >
                Toggle
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
