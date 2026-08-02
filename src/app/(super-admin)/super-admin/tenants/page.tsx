"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/dashboard/page-header";

export default function TenantsPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("Growth");

  const load = async () => {
    const { data } = await api.get("/super-admin/tenants");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load tenants"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Tenant management" subtitle="Onboard and manage cinema chains" />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Tenant name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
        <Button
          onClick={async () => {
            if (!name) return;
            await api.post("/super-admin/tenants", { name, plan, mrr: 15000, status: "trial" });
            toast.success("Tenant created");
            setName("");
            load();
          }}
        >
          Add tenant
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.id} className="rounded-xl border border-border p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.plan} · since {t.createdAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent font-semibold">{formatCurrency(t.mrr)}/mo</span>
              <Badge variant={t.status === "active" ? "success" : "outline"}>{t.status}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const status = t.status === "active" ? "suspended" : "active";
                  await api.patch("/super-admin/tenants", { id: t.id, status });
                  toast.success(`Tenant ${status}`);
                  load();
                }}
              >
                {t.status === "active" ? "Suspend" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
