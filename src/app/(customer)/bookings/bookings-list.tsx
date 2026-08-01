"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { useAuthStore } from "@/stores/auth.store";

interface BookingRow {
  _id: string;
  bookingNumber: string;
  status: string;
  finalAmount: number;
  seats: { seatId?: string; row?: string; number?: number }[];
  qrCode?: string;
  movieTitle?: string;
  theatreName?: string;
  date?: string;
  time?: string;
  movieId?: { title?: string; poster?: string; slug?: string };
  theatreId?: { name?: string; city?: string };
  showId?: { date?: string; startTime?: string };
}

export default function BookingsList() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.accessToken);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("payu") === "failed") toast.error("PayU payment failed");
    if (searchParams.get("payu") === "success") toast.success("PayU payment successful");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get("/bookings/my");
        if (!cancelled) setBookings(data.data || []);
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const cancelBooking = async (id: string) => {
    try {
      await api.post(`/bookings/${id}/cancel`, { reason: "User cancelled" });
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Cancelled — refund credited where applicable");
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Cancel failed"
      );
    }
  };

  const downloadPdf = async (id: string, bookingNumber: string) => {
    try {
      const res = await api.get(`/bookings/${id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${bookingNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("PDF download failed");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">My bookings</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/movies">Book more</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-3">
          <p className="text-muted-foreground">No bookings yet.</p>
          <Button asChild>
            <Link href="/movies">Browse movies</Link>
          </Button>
        </div>
      ) : (
        bookings.map((b) => {
          const title = b.movieTitle || b.movieId?.title || "Movie";
          const theatre = b.theatreName || b.theatreId?.name || "Theatre";
          const when = b.date
            ? `${b.date}${b.time ? ` · ${b.time}` : ""}`
            : b.showId?.date || "";
          const seats = b.seats
            ?.map((s) => s.seatId || `${s.row}${s.number}`)
            .join(", ");

          return (
            <article
              key={b._id}
              className="rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg">{title}</h2>
                  <p className="text-sm text-muted-foreground">{theatre}</p>
                  <p className="text-sm text-muted-foreground">{when}</p>
                  <p className="text-sm mt-1">
                    Seats <strong>{seats}</strong> · {formatCurrency(b.finalAmount)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground mt-2">
                    {b.bookingNumber}
                  </p>
                </div>
                <Badge variant={b.status === "confirmed" ? "success" : "outline"}>
                  {b.status}
                </Badge>
              </div>

              {b.status === "confirmed" && b.qrCode && (
                <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.qrCode}
                    alt="QR preview"
                    className="w-20 h-20 rounded-md bg-white p-1"
                  />
                  <p className="text-xs text-muted-foreground">
                    QR ticket ready — open full ticket to scan at the gate.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/bookings/${b._id}`}>Show QR ticket</Link>
                </Button>
                {b.status === "confirmed" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPdf(b._id, b.bookingNumber)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => cancelBooking(b._id)}
                    >
                      Cancel & refund
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
