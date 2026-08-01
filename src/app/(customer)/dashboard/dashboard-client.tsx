"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { PageHeader } from "@/components/dashboard/page-header";

interface BookingRow {
  _id: string;
  bookingNumber: string;
  status: string;
  finalAmount: number;
  movieTitle?: string;
  theatreName?: string;
  date?: string;
  time?: string;
  movieId?: { title?: string };
  theatreId?: { name?: string };
}

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function DashboardClient() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [wallet, setWallet] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    if (searchParams.get("booked")) toast.success("Ticket ready in My Bookings");
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      api.get("/bookings/my"),
      api.get("/wallet"),
      api.get("/wishlist"),
      api.get("/users/profile"),
      api.get("/notifications"),
    ]).then(([b, w, wl, p, n]) => {
      if (b.status === "fulfilled") setBookings(b.value.data.data || []);
      if (w.status === "fulfilled") setWallet(w.value.data.data.wallet?.balance || 0);
      if (wl.status === "fulfilled") setWishlistCount(wl.value.data.data?.length || 0);
      if (p.status === "fulfilled") setPoints(p.value.data.data?.rewardPoints || 0);
      if (n.status === "fulfilled") setNotifications(n.value.data.data || []);
    });
  }, [token]);

  const confirmed = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title={`Hey ${user?.name?.split(" ")[0] || "there"}`}
        subtitle="Your cinema command center"
        actions={
          <Button asChild>
            <Link href="/movies">Book tickets</Link>
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bookings" value={bookings.length} hint={`${confirmed.length} active`} />
        <StatCard label="Wallet" value={formatCurrency(wallet)} />
        <StatCard label="Reward points" value={points} hint="1 pt / ₹10" />
        <StatCard label="Wishlist" value={wishlistCount} />
      </div>

      <section id="notifications">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await api.patch("/notifications", { all: true });
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              toast.success("Marked all read");
            }}
          >
            Mark all read
          </Button>
        </div>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n._id}
                className={`rounded-xl border p-4 text-sm ${n.isRead ? "border-border" : "border-primary/40 bg-primary/5"}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent bookings</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/bookings">View all</Link>
          </Button>
        </div>
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No bookings yet.{" "}
              <Link href="/movies" className="text-primary underline">
                Browse movies
              </Link>
            </div>
          ) : (
            bookings.slice(0, 5).map((b) => (
              <Link
                key={b._id}
                href={`/bookings/${b._id}`}
                className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/50 transition-colors block"
              >
                <div>
                  <p className="font-medium">
                    {b.movieTitle || b.movieId?.title || "Movie"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {b.theatreName || b.theatreId?.name} · {b.date} {b.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-accent">
                    {formatCurrency(b.finalAmount)}
                  </span>
                  <Badge variant={b.status === "confirmed" ? "success" : "outline"}>
                    {b.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
