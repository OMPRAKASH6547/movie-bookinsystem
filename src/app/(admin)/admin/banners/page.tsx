"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AdminBannersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/banners");
    setItems(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load banners"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Advertisement banners" subtitle="Homepage & promo placements" />
      <div className="flex gap-2">
        <Input placeholder="Banner title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button
          onClick={async () => {
            if (!title) return;
            await api.post("/admin/banners", { title });
            toast.success("Banner created");
            setTitle("");
            load();
          }}
        >
          Add banner
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((b) => (
          <div key={b.id} className="rounded-xl border border-border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt="" className="h-36 w-full object-cover" />
            <div className="p-4 flex justify-between gap-3">
              <div>
                <p className="font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.placement}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={b.active ? "success" : "outline"}>
                  {b.active ? "live" : "off"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await api.patch("/admin/banners", { id: b.id, active: !b.active });
                    load();
                  }}
                >
                  Toggle
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
