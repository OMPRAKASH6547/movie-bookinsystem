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
import { ListSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { ErrorState } from "@/components/loading/error-state";
import { SmartImage } from "@/components/loading/smart-image";

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
  const [error, setError] = useState<unknown>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const token = useAuthStore((s) => s.accessToken);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("payu") === "failed") toast.error("PayU payment failed");
    if (searchParams.get("payu") === "success") toast.success("PayU payment successful");
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/bookings/my");
      setBookings(data.data || []);
    } catch (err) {
      setError(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cancelBooking = async (id: string) => {
    setActionId(`cancel-${id}`);
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
    } finally {
      setActionId(null);
    }
  };

  const downloadPdf = async (id: string, bookingNumber: string) => {
    setActionId(`pdf-${id}`);
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
    } finally {
      setActionId(null);
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
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorState onRetry={load} message="Could not load your bookings." />
      ) : bookings.length === 0 ? (
        <EmptyState variant="bookings" />
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
                  <SmartImage
                    src={b.qrCode}
                    alt="QR preview"
                    containerClassName="w-20 h-20 rounded-md overflow-hidden bg-white p-1"
                    className="w-full h-full object-contain"
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
                      loading={actionId === `pdf-${b._id}`}
                      loadingText="Downloading…"
                      onClick={() => downloadPdf(b._id, b.bookingNumber)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      loading={actionId === `cancel-${b._id}`}
                      loadingText="Cancelling…"
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
