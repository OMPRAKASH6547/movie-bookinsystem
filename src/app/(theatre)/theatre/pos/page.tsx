"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";
import { ShowScheduleSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";

const PAY_METHODS = ["cash", "card", "upi", "wallet", "split"] as const;

export default function PosPage() {
  const [shows, setShows] = useState<any[]>([]);
  const [showId, setShowId] = useState("");
  const [seatInput, setSeatInput] = useState("A1,A2");
  const [method, setMethod] = useState<(typeof PAY_METHODS)[number]>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [splitCard, setSplitCard] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [last, setLast] = useState<any>(null);
  const [thermalWidth, setThermalWidth] = useState<58 | 80>(80);
  const [cancelId, setCancelId] = useState("");
  const [loadingShows, setLoadingShows] = useState(true);
  const [booking, setBooking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.post("/pos/session", { counterId: "COUNTER-1" }).catch(() => null);
    setLoadingShows(true);
    api
      .get("/owner/shows")
      .then((r) => {
        const list = (r.data.data || []).filter(
          (s: any) => s.isActive !== false && s.status !== "cancelled"
        );
        setShows(list);
        if (list[0]) setShowId(list[0]._id);
      })
      .finally(() => setLoadingShows(false));
  }, []);

  const selected = useMemo(() => shows.find((s) => s._id === showId), [shows, showId]);

  const seats = seatInput
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .map((seatId) => {
      const row = seatId[0];
      const number = Number(seatId.slice(1)) || 1;
      const type = row <= "B" ? "vip" : row <= "D" ? "premium" : "regular";
      const price =
        selected?.pricing?.find((p: any) => p.seatType === type)?.price ||
        selected?.basePrice ||
        220;
      return { seatId, row, number, type, price };
    });

  const total = seats.reduce((a, s) => a + s.price, 0);

  const book = async () => {
    setBooking(true);
    try {
      const payload: any = {
        showId,
        seats,
        paymentMethod: method,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        counterId: "COUNTER-1",
      };
      if (method === "split") {
        payload.splitPayments = [
          { method: "cash", amount: Number(splitCash) || 0 },
          { method: "card", amount: Number(splitCard) || 0 },
        ];
      }
      const { data } = await api.post("/pos/book", payload);
      setLast(data.data);
      toast.success("Ticket booked");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Offline POS"
        subtitle="Walk-in booking · cash/card/UPI/wallet/split · thermal print"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4 rounded-xl border border-border p-4">
          <label className="block text-sm font-medium">Show</label>
          {loadingShows ? (
            <ShowScheduleSkeleton count={2} />
          ) : !shows.length ? (
            <EmptyState variant="shows" className="py-6" />
          ) : (
            <select
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={showId}
              onChange={(e) => setShowId(e.target.value)}
            >
              {shows.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.movieId?.title || "Movie"} · {s.theatreId?.name || "Theatre"} ·{" "}
                  {s.startTime ? new Date(s.startTime).toLocaleString("en-IN") : ""}
                </option>
              ))}
            </select>
          )}

          <Input
            placeholder="Seats (comma separated) e.g. A1,A2,B5"
            value={seatInput}
            onChange={(e) => setSeatInput(e.target.value)}
          />
          <Input
            placeholder="Customer name (walk-in)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            placeholder="Customer phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={method === m ? "default" : "outline"}
                onClick={() => setMethod(m)}
              >
                {m.toUpperCase()}
              </Button>
            ))}
          </div>

          {method === "split" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Cash amount"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
              />
              <Input
                placeholder="Card amount"
                value={splitCard}
                onChange={(e) => setSplitCard(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="font-semibold">{formatCurrency(Math.round(total * 1.18))}</p>
            <Button
              onClick={book}
              disabled={!showId || !seats.length}
              loading={booking}
              loadingText="Booking…"
            >
              Confirm booking
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4">
          <h3 className="font-semibold">Last ticket</h3>
          {!last && <p className="text-sm text-muted-foreground">No booking yet</p>}
          {last && (
            <>
              <p className="font-medium">{last.bookingNumber}</p>
              <p className="text-sm text-muted-foreground">
                {last.movie?.title} · {last.seats?.map((s: any) => s.seatId).join(", ")}
              </p>
              <p className="text-accent font-semibold">{formatCurrency(last.finalAmount)}</p>
              {last.qrCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={last.qrCode} alt="QR" className="h-36 w-36 bg-white p-2 rounded" />
              )}
              <Badge>{last.barcode}</Badge>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setThermalWidth(58)}
                >
                  58mm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setThermalWidth(80)}
                >
                  80mm
                </Button>
                <Button
                  size="sm"
                  loading={printing}
                  loadingText="Printing…"
                  onClick={async () => {
                    setPrinting(true);
                    try {
                      const { data } = await api.post("/pos/reprint", {
                        bookingId: last._id,
                        width: thermalWidth,
                      });
                      setLast({ ...last, ...data.data.booking });
                      const w = window.open("", "_blank", "width=400,height=700");
                      if (w) {
                        w.document.write(
                          `<pre style="font-family:monospace;font-size:12px">${data.data.thermal.text}</pre>`
                        );
                        if (data.data.thermal.qrCode) {
                          w.document.write(
                            `<img src="${data.data.thermal.qrCode}" width="160"/>`
                          );
                        }
                        w.document.close();
                        w.print();
                      }
                    } finally {
                      setPrinting(false);
                    }
                  }}
                >
                  Print ticket ({thermalWidth}mm)
                </Button>
              </div>
            </>
          )}

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium">Cancel / refund</p>
            <Input
              placeholder="Booking ID"
              value={cancelId}
              onChange={(e) => setCancelId(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              loading={cancelling}
              loadingText="Cancelling…"
              onClick={async () => {
                setCancelling(true);
                try {
                  await api.post("/pos/cancel", { bookingId: cancelId || last?._id });
                  toast.success("Cancelled & refunded");
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || "Cancel failed");
                } finally {
                  setCancelling(false);
                }
              }}
            >
              Cancel booking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
