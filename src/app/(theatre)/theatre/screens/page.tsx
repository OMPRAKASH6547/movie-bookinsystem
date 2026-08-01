"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function TheatreScreensPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("DOLBY");

  const load = async () => {
    const { data } = await api.get("/theatre/screens");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load screens"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Screens" subtitle="Manage auditoriums and formats" />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Screen name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Type e.g. IMAX" value={type} onChange={(e) => setType(e.target.value)} />
        <Button
          onClick={async () => {
            if (!name) return;
            try {
              await api.post("/theatre/screens", { name, screenType: type, capacity: 96 });
              toast.success("Screen created");
              setName("");
              load();
            } catch (e: unknown) {
              toast.error(
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                  "Create failed — ensure theatre exists (run seed)"
              );
            }
          }}
        >
          Add screen
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s._id} className="rounded-xl border border-border p-4 flex justify-between">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {s.screenType} · capacity {s.capacity} · {s.theatreId?.name || "Theatre"}
              </p>
            </div>
            <Badge variant={s.isActive !== false ? "success" : "outline"}>
              {s.isActive !== false ? "active" : "off"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
