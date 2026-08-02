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

export default function PlansPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("19999");

  const load = async () => {
    const { data } = await api.get("/super-admin/plans");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load plans"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription plans" subtitle="Billing tiers for tenants" />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button
          onClick={async () => {
            if (!name) return;
            await api.post("/super-admin/plans", {
              name,
              price: Number(price),
              theatres: 10,
              features: ["Bookings", "Analytics"],
            });
            toast.success("Plan created");
            setName("");
            load();
          }}
        >
          Add plan
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-5 space-y-3">
            <div className="flex justify-between">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <Badge variant={p.active ? "success" : "outline"}>
                {p.active ? "active" : "off"}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-accent">{formatCurrency(p.price)}/mo</p>
            <p className="text-sm text-muted-foreground">Up to {p.theatres} theatres</p>
            <ul className="text-sm space-y-1">
              {(p.features || []).map((f: string) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await api.patch("/super-admin/plans", { id: p.id, active: !p.active });
                load();
              }}
            >
              Toggle
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
