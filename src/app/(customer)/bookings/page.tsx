"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BOOKINGS = [
  {
    id: "CP-DEMO-001",
    movie: "Neon Horizon",
    theatre: "PVR ICON Andheri",
    date: "Aug 3, 2026 · 9:15 PM",
    seats: "F5, F6",
    status: "confirmed",
    amount: "₹648",
    qr: true,
  },
  {
    id: "CP-DEMO-002",
    movie: "Shadow Protocol",
    theatre: "Cinepolis Power",
    date: "Jul 20, 2026 · 6:45 PM",
    seats: "D8",
    status: "cancelled",
    amount: "₹320",
    qr: false,
  },
];

export default function BookingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl tracking-tight">My bookings</h1>
      {BOOKINGS.map((b) => (
        <article key={b.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg">{b.movie}</h2>
              <p className="text-sm text-muted-foreground">{b.theatre}</p>
              <p className="text-sm text-muted-foreground">{b.date}</p>
              <p className="text-sm mt-1">
                Seats <strong>{b.seats}</strong> · {b.amount}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-2">{b.id}</p>
            </div>
            <Badge variant={b.status === "confirmed" ? "success" : "outline"}>{b.status}</Badge>
          </div>
          {b.status === "confirmed" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => toast.success("QR ticket opened")}>
                Show QR
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.success("PDF download started")}>
                Download PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.success("Share link copied")}>
                Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => toast.info("Refund credited to wallet")}
              >
                Cancel & refund
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
