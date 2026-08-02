"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AdminTheatresPage() {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Mumbai");

  const load = async () => {
    const { data } = await api.get("/admin/theatres");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load theatres"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Theatre management" subtitle="Partner venues across cities" />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Theatre name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Button
          onClick={async () => {
            if (!name) return;
            await api.post("/admin/theatres", { name, city, address: `${name}, ${city}` });
            toast.success("Theatre created");
            setName("");
            load();
          }}
        >
          Add theatre
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((t) => (
          <div key={t._id} className="rounded-xl border border-border p-4 flex justify-between gap-3">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.city} · {t.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={t.isActive ? "success" : "outline"}>
                {t.isActive ? "active" : "inactive"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await api.patch("/admin/theatres", { id: t._id, isActive: !t.isActive });
                  toast.success("Updated");
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
