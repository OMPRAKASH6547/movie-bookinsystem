"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { useAuthStore } from "@/stores/auth.store";

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export default function NotificationsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const load = () =>
    api.get("/notifications").then((res) => setItems(res.data.data || [])).catch(() => setItems([]));

  useEffect(() => {
    if (token) load();
  }, [token]);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Booking, payment and offer alerts"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await api.patch("/notifications", { all: true });
              toast.success("All marked as read");
              load();
            }}
          >
            Mark all read
          </Button>
        }
      />

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notifications.</p>
        ) : (
          items.map((n) => (
            <button
              key={n._id}
              type="button"
              className={`w-full text-left rounded-xl border p-4 ${n.isRead ? "border-border" : "border-primary/40 bg-primary/5"}`}
              onClick={async () => {
                await api.patch("/notifications", { id: n._id });
                setItems((prev) =>
                  prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
                );
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge variant="outline">{n.type}</Badge>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
