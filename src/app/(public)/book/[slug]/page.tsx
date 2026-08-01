"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEED_MOVIES } from "@/data/movies";
import { useBookingStore } from "@/stores/booking.store";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

const THEATRES = [
  { id: "t1", name: "PVR ICON Andheri", times: ["10:30 AM", "1:45 PM", "5:00 PM", "9:15 PM"] },
  { id: "t2", name: "INOX Metro", times: ["11:00 AM", "2:30 PM", "6:45 PM", "10:00 PM"] },
  { id: "t3", name: "Cinepolis Power", times: ["12:15 PM", "3:30 PM", "7:00 PM", "10:30 PM"] },
];

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});

type Seat = {
  id: string;
  row: string;
  number: number;
  type: string;
  price: number;
  status: string;
  isAisle?: boolean;
};

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const movie = SEED_MOVIES.find((m) => m.slug === slug);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    selectedSeats,
    totalAmount,
    discount,
    couponCode,
    theatreName,
    showId,
    toggleSeat,
    setMovie,
    setTheatre,
    setShow,
    setCoupon,
    clear,
  } = useBookingStore();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(DATES[0]);
  const [theatreId, setTheatreId] = useState<string | null>(null);
  const [showTime, setShowTime] = useState<string | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "payu" | "upi" | "card" | "wallet" | "net_banking"
  >("payu");

  useEffect(() => {
    if (movie) setMovie(movie);
    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?._id]);

  useEffect(() => {
    if (step === 3) {
      api
        .get(`/bookings/seats/demo-${slug}`)
        .then((res) => setSeats(res.data.data.seats))
        .catch(() => toast.error("Failed to load seats"));
    }
  }, [step, slug]);

  const seatsByRow = useMemo(() => {
    const map = new Map<string, Seat[]>();
    for (const seat of seats) {
      if (!map.has(seat.row)) map.set(seat.row, []);
      map.get(seat.row)!.push(seat);
    }
    return Array.from(map.entries());
  }, [seats]);

  if (!movie) {
    return (
      <div className="container-page py-20 text-center">
        <p>Movie not found</p>
      </div>
    );
  }

  const tax = Math.round((totalAmount - discount) * 0.18);
  const finalAmount = totalAmount - discount + tax;

  const applyCoupon = async () => {
    try {
      const { data } = await api.post("/coupons/validate", {
        code: couponInput,
        amount: totalAmount,
      });
      setCoupon(data.data.code, data.data.discount);
      toast.success(`Saved ${formatCurrency(data.data.discount)}`);
    } catch {
      toast.error("Invalid coupon");
    }
  };

  const ensureAuth = async () => {
    if (user) return user;
    try {
      const res = await api.post("/auth/guest", {
        name: "Guest Moviegoer",
        email: `guest_${Date.now()}@cinepass.app`,
      });
      setAuth(res.data.data.user, res.data.data.accessToken);
      return res.data.data.user;
    } catch {
      toast.info("Please sign in to complete booking");
      router.push(`/login?next=/book/${slug}`);
      return null;
    }
  };

  const handlePay = async () => {
    if (!movie || !theatreId || !showTime || !selectedSeats.length) {
      toast.error("Incomplete booking details");
      return;
    }

    setPaying(true);
    try {
      const authUser = await ensureAuth();
      if (!authUser) {
        setPaying(false);
        return;
      }

      const seatPayload = selectedSeats.map((id) => {
        const seat = seats.find((s) => s.id === id);
        const row = id.replace(/\d+/g, "");
        const number = Number(id.replace(/\D+/g, ""));
        return {
          seatId: id,
          row: seat?.row || row,
          number: seat?.number || number,
          type: seat?.type || "regular",
          price: seat?.price || 220,
        };
      });

      const showKey = showId || `show-${theatreId}-${showTime}-${date}`;

      // Lock seats first
      try {
        await api.post("/bookings/lock", {
          showId: showKey,
          seatIds: selectedSeats,
        });
      } catch {
        /* lock may fail without auth permission for guest — checkout still locks */
      }

      const { data } = await api.post("/bookings/checkout", {
        movieId: movie._id,
        movieTitle: movie.title,
        moviePoster: movie.poster,
        movieSlug: movie.slug,
        theatreId,
        theatreName: theatreName || THEATRES.find((t) => t.id === theatreId)?.name || "Theatre",
        showId: showKey,
        date,
        time: showTime,
        seats: seatPayload,
        totalAmount,
        discount,
        tax,
        finalAmount,
        couponCode: couponCode || undefined,
        paymentMethod,
        userName: authUser.name,
      });

      const result = data.data;

      if (result.mode === "payu_redirect" && result.payu) {
        toast.info("Redirecting to PayU Money…");
        const form = document.createElement("form");
        form.method = "POST";
        form.action = result.checkoutUrl;
        Object.entries(result.payu as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value ?? "");
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      const bookingId = result.booking?._id;
      toast.success("Payment successful! Your QR ticket is ready.");
      clear();
      router.push(bookingId ? `/bookings/${bookingId}` : "/bookings");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Payment failed";
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="container-page py-8 relative z-10 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative h-20 w-14 rounded-lg overflow-hidden shrink-0">
          <Image src={movie.poster} alt="" fill className="object-cover" sizes="56px" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl">{movie.title}</h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of 4 · {movie.languages[0]} · {movie.certification}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {["Theatre & time", "Date", "Seats", "Pay"].map((label, i) => (
          <Badge
            key={label}
            variant={step === i + 1 ? "default" : step > i + 1 ? "success" : "outline"}
          >
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg mb-4">Select theatre & showtime</h2>
          {THEATRES.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                theatreId === t.id ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <button
                type="button"
                className="font-semibold mb-3 text-left w-full"
                onClick={() => setTheatreId(t.id)}
              >
                {t.name}
              </button>
              <div className="flex flex-wrap gap-2">
                {t.times.map((time) => (
                  <Button
                    key={time}
                    size="sm"
                    variant={theatreId === t.id && showTime === time ? "default" : "outline"}
                    onClick={() => {
                      setTheatreId(t.id);
                      setShowTime(time);
                      setTheatre(t.id, t.name);
                      setShow(`show-${t.id}-${time}`, time, date);
                    }}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Button
            className="mt-4"
            disabled={!theatreId || !showTime}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold text-lg mb-4">Pick a date</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {DATES.map((d) => (
              <Button
                key={d}
                variant={date === d ? "default" : "outline"}
                onClick={() => {
                  setDate(d);
                  if (showTime) setShow(`show-${theatreId}-${showTime}`, showTime, d);
                }}
              >
                {new Date(d).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Select seats</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="text-center mb-6">
            <div className="mx-auto mb-2 h-1 w-48 rounded bg-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">SCREEN THIS WAY</p>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="inline-block min-w-full space-y-2">
              {seatsByRow.map(([row, rowSeats]) => (
                <div key={row} className="flex items-center justify-center gap-1.5">
                  <span className="w-5 text-xs text-muted-foreground font-mono">{row}</span>
                  {rowSeats.map((seat) => {
                    const selected = selectedSeats.includes(seat.id);
                    const disabled = seat.status === "booked" || seat.status === "locked";
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={disabled}
                        aria-label={`Seat ${seat.id} ${seat.status}`}
                        onClick={() => toggleSeat(seat.id, seat.price)}
                        className={cn(
                          "seat",
                          selected
                            ? "seat-selected"
                            : disabled
                              ? "seat-booked"
                              : "seat-available",
                          seat.type === "premium" && !selected && !disabled && "seat-premium",
                          seat.type === "recliner" && !selected && !disabled && "seat-recliner",
                          seat.isAisle && "ml-3"
                        )}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs mt-6 mb-8">
            <span className="flex items-center gap-1.5">
              <span className="seat seat-available !w-4 !h-4" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="seat seat-selected !w-4 !h-4" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="seat seat-booked !w-4 !h-4" /> Sold
            </span>
            <span className="flex items-center gap-1.5">
              <span className="seat seat-premium seat-available !w-4 !h-4" /> Premium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="seat seat-recliner seat-available !w-4 !h-4" /> Recliner
            </span>
          </div>

          <div className="sticky bottom-4 rounded-xl border border-border bg-card/95 backdrop-blur p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">
                {selectedSeats.length
                  ? `Seats: ${selectedSeats.join(", ")}`
                  : "Select seats to continue"}
              </p>
              <p className="text-lg font-bold text-accent">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button disabled={!selectedSeats.length} onClick={() => setStep(4)}>
                Proceed to pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3 text-sm">
            <h2 className="font-semibold text-lg mb-4">Order summary</h2>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Movie</span>
              <span>{movie.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{showTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seats</span>
              <span>{selectedSeats.join(", ")}</span>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Discount ({couponCode})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total</span>
                <span className="text-accent">{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Try CINEPASS50, STUDENT20, WALLET150</p>

            <div className="space-y-2">
              <p className="font-medium text-sm">Payment method</p>
              {(
                [
                  { id: "payu", label: "PayU Money (UPI / Cards / NetBanking)" },
                  { id: "upi", label: "UPI (Demo instant)" },
                  { id: "card", label: "Card (Demo instant)" },
                  { id: "wallet", label: "CinePass Wallet" },
                  { id: "net_banking", label: "Net Banking (Demo)" },
                ] as const
              ).map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    paymentMethod === m.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary"
                  )}
                >
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === m.id}
                    onChange={() => setPaymentMethod(m.id)}
                  />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                Without PayU keys in `.env`, PayU falls back to instant demo confirmation with a
                real QR ticket.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handlePay} disabled={paying}>
                {paying ? "Processing…" : `Pay ${formatCurrency(finalAmount)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
