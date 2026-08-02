"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Share2, ArrowLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { useAuthStore } from "@/stores/auth.store";
import { downloadTicketPdf } from "@/lib/download-ticket";

interface Ticket {
  _id: string;
  bookingNumber: string;
  movieTitle?: string;
  moviePoster?: string;
  theatreName?: string;
  date?: string;
  time?: string;
  seats: { seatId?: string; row?: string; number?: number; price?: number }[];
  finalAmount: number;
  status: string;
  qrCode?: string;
  paymentMethod?: string;
  transactionId?: string;
  userName?: string;
  movieId?: { title?: string; poster?: string };
  theatreId?: { name?: string };
  showId?: { date?: string; startTime?: string };
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useAuthStore((s) => s.accessToken);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get(`/bookings/${id}/ticket`);
        if (!cancelled) setTicket(data.data);
      } catch {
        // Fallback: localStorage last booking
        try {
          const raw = localStorage.getItem("cinepass-last-ticket");
          if (raw) {
            const parsed = JSON.parse(raw) as Ticket;
            if (parsed._id === id && !cancelled) setTicket(parsed);
          }
        } catch {
          /* ignore */
        }
        if (!cancelled && !ticket) toast.error("Could not load ticket");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const title = ticket?.movieTitle || ticket?.movieId?.title || "Movie";
  const poster = ticket?.moviePoster || ticket?.movieId?.poster;
  const theatre = ticket?.theatreName || ticket?.theatreId?.name || "Theatre";
  const date = ticket?.date || ticket?.showId?.date || "";
  const time = ticket?.time || ticket?.showId?.startTime || "";
  const seatLabel = ticket?.seats
    ?.map((s) => s.seatId || `${s.row}${s.number}`)
    .join(", ");

  const downloadPdf = async () => {
    if (!ticket) return;
    setDownloading(true);
    try {
      await downloadTicketPdf(ticket._id, ticket.bookingNumber);
      toast.success("PDF downloaded");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "PDF download failed — try again after signing in"
      );
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const text = `${title} · ${theatre} · ${date} ${time} · Seats ${seatLabel} · ${ticket?.bookingNumber}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "CinePass Ticket", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Ticket details copied");
      }
    } catch {
      toast.info("Share cancelled");
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading ticket…</div>;
  }

  if (!ticket) {
    return (
      <div className="max-w-lg space-y-4 p-4">
        <p>Ticket not found.</p>
        <Button asChild>
          <Link href="/bookings">Back to bookings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/bookings">
          <ArrowLeft className="h-4 w-4" />
          All bookings
        </Link>
      </Button>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
        <div className="bg-secondary text-secondary-foreground p-5 flex gap-4">
          {poster && (
            <div className="relative h-24 w-16 rounded-lg overflow-hidden shrink-0">
              <Image src={poster} alt="" fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div>
            <Badge variant="success" className="mb-2 capitalize">
              {ticket.status}
            </Badge>
            <h1 className="font-display text-2xl leading-tight">{title}</h1>
            <p className="text-sm text-secondary-foreground/70 mt-1">{theatre}</p>
          </div>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Show time</span>
            <span className="font-medium">{time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seats</span>
            <span className="font-medium">{seatLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-accent">{formatCurrency(ticket.finalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booking ID</span>
            <span className="font-mono text-xs">{ticket.bookingNumber}</span>
          </div>
          {ticket.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid via</span>
              <span className="uppercase text-xs font-semibold">{ticket.paymentMethod}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-border p-6 flex flex-col items-center gap-3 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <QrCode className="h-4 w-4 text-primary" />
            Scan at entrance
          </div>
          {ticket.qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.qrCode}
              alt={`QR ticket ${ticket.bookingNumber}`}
              className="w-56 h-56 rounded-xl bg-white p-3 shadow-md"
            />
          ) : (
            <div className="w-56 h-56 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
              QR unavailable
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Show this QR at the gate. Do not share publicly.
          </p>
        </div>

        <div className="p-4 flex flex-wrap gap-2 border-t border-border">
          <Button className="flex-1" onClick={downloadPdf} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
