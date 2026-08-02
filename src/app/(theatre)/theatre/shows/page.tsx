"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

export default function TheatreShowsPage() {
  const [shows, setShows] = useState<JsonRecord[]>([]);
  const [movies, setMovies] = useState<JsonRecord[]>([]);
  const [screens, setScreens] = useState<JsonRecord[]>([]);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [movieId, setMovieId] = useState("");
  const [screenId, setScreenId] = useState("");
  const [theatreId, setTheatreId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [times, setTimes] = useState("14:00,18:00,21:15");
  const [recurringDays, setRecurringDays] = useState("3");
  const [basePrice, setBasePrice] = useState("220");
  const [weekendBump, setWeekendBump] = useState("50");

  const load = async () => {
    const [s, m, sc, th] = await Promise.all([
      api.get("/owner/shows"),
      api.get("/owner/movies"),
      api.get("/owner/screens"),
      api.get("/owner/theatres"),
    ]);
    setShows(s.data.data || []);
    setMovies(m.data.data || []);
    setScreens(sc.data.data || []);
    setTheatres(th.data.data || []);
    if (!movieId && m.data.data?.[0]) setMovieId(m.data.data[0]._id);
    if (!screenId && sc.data.data?.[0]) setScreenId(sc.data.data[0]._id);
    if (!theatreId && th.data.data?.[0]) setTheatreId(th.data.data[0]._id);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load shows"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredScreens = screens.filter((s) => {
    const tid = s.theatreId?._id || s.theatreId;
    return !theatreId || tid === theatreId;
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Show management"
        subtitle="Multi-slot, recurring, weekend/holiday pricing, cancel & reschedule"
      />

      <div className="rounded-xl border border-border p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-sm">
          Theatre
          <select
            className="mt-1 block w-full h-11 rounded-lg border border-border bg-card px-3"
            value={theatreId}
            onChange={(e) => setTheatreId(e.target.value)}
          >
            {theatres.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Movie
          <select
            className="mt-1 block w-full h-11 rounded-lg border border-border bg-card px-3"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
          >
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Screen
          <select
            className="mt-1 block w-full h-11 rounded-lg border border-border bg-card px-3"
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
          >
            {filteredScreens.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          placeholder="Times HH:MM comma separated"
          value={times}
          onChange={(e) => setTimes(e.target.value)}
        />
        <Input
          placeholder="Recurring days"
          value={recurringDays}
          onChange={(e) => setRecurringDays(e.target.value)}
        />
        <Input
          placeholder="Base price"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
        />
        <Input
          placeholder="Weekend bump ₹"
          value={weekendBump}
          onChange={(e) => setWeekendBump(e.target.value)}
        />
        <Button
          onClick={async () => {
            try {
              const base = Number(basePrice) || 220;
              const bump = Number(weekendBump) || 0;
              await api.post("/owner/shows", {
                movieId,
                theatreId,
                screenId,
                date,
                times: times.split(",").map((t) => t.trim()).filter(Boolean),
                recurringDays: Number(recurringDays) || 1,
                basePrice: base,
                pricing: [
                  { seatType: "regular", price: base },
                  { seatType: "premium", price: Math.round(base * 1.4) },
                  { seatType: "vip", price: Math.round(base * 2) },
                ],
                weekendPricing: [
                  { seatType: "regular", price: base + bump },
                  { seatType: "premium", price: Math.round(base * 1.4) + bump },
                  { seatType: "vip", price: Math.round(base * 2) + bump },
                ],
                holidayPricing: [
                  { seatType: "regular", price: base + bump + 30 },
                  { seatType: "premium", price: Math.round(base * 1.4) + bump + 30 },
                  { seatType: "vip", price: Math.round(base * 2) + bump + 50 },
                ],
              });
              toast.success("Shows created");
              load();
            } catch (e: unknown) {
              toast.error(apiErrorMessage(e, "Create failed"));
            }
          }}
        >
          Create shows
        </Button>
      </div>

      <div className="space-y-3">
        {shows.map((s) => (
          <div
            key={s._id}
            className="rounded-xl border border-border p-4 flex flex-col sm:flex-row justify-between gap-3"
          >
            <div>
              <p className="font-medium">{s.movieId?.title || "Movie"}</p>
              <p className="text-sm text-muted-foreground">
                {s.theatreId?.name} · {s.screenId?.name} · {s.language} · ₹{s.basePrice}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {s.startTime
                  ? new Date(s.startTime).toLocaleString("en-IN")
                  : "—"}
                {s.recurrenceGroupId ? " · recurring" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={s.status === "cancelled" ? "outline" : "success"}>
                {s.status || "scheduled"} · {s.availableSeats}/{s.totalSeats}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const start = prompt(
                    "New start time (ISO or leave for +1 day)",
                    new Date(new Date(s.startTime).getTime() + 86400000).toISOString()
                  );
                  if (!start) return;
                  await api.patch("/owner/shows", {
                    id: s._id,
                    action: "reschedule",
                    startTime: start,
                  });
                  toast.success("Rescheduled");
                  load();
                }}
              >
                Reschedule
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await api.patch("/owner/shows", {
                    id: s._id,
                    action: "cancel",
                    reason: "Cancelled by operator",
                  });
                  toast.success("Cancelled");
                  load();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
