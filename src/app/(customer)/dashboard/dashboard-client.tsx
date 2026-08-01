"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { SEED_MOVIES } from "@/data/movies";

const DEMO_BOOKINGS = [
  {
    id: "b1",
    movie: "Neon Horizon",
    theatre: "PVR ICON Andheri",
    date: "Aug 3, 2026",
    seats: "F5, F6",
    status: "confirmed",
    amount: "₹648",
  },
  {
    id: "b2",
    movie: "The Last Monsoon",
    theatre: "INOX Metro",
    date: "Jul 28, 2026",
    seats: "C3",
    status: "confirmed",
    amount: "₹320",
  },
];

export function DashboardClient() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const booked = searchParams.get("booked");

  useEffect(() => {
    if (booked) toast.success("Your QR ticket is ready in My Bookings");
  }, [booked]);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Hey {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground mt-1">Your cinema command center</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bookings" value={DEMO_BOOKINGS.length + (booked ? 1 : 0)} />
        <StatCard label="Wallet" value="₹100" hint="Welcome bonus" />
        <StatCard label="Reward points" value="64" hint="1 pt / ₹10" />
        <StatCard label="Wishlist" value="3" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent bookings</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/bookings">View all</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {booked && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">New booking confirmed</p>
                <p className="text-sm text-muted-foreground">QR ticket generated · Check email</p>
              </div>
              <Badge variant="success">Confirmed</Badge>
            </div>
          )}
          {DEMO_BOOKINGS.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{b.movie}</p>
                <p className="text-sm text-muted-foreground">
                  {b.theatre} · {b.date} · Seats {b.seats}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-accent">{b.amount}</span>
                <Badge variant="success">{b.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-4">Continue watching trailers</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {SEED_MOVIES.slice(0, 3).map((m) => (
            <Link
              key={m._id}
              href={`/movies/${m.slug}`}
              className="rounded-xl border border-border p-4 hover:border-primary transition-colors"
            >
              <p className="font-medium line-clamp-1">{m.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {m.genres[0]} · ★ {m.rating}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
