"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/format";

const SHOWS = [
  { movie: "Neon Horizon", screen: "Audi 1", time: "9:15 PM", sold: 142, capacity: 180 },
  { movie: "Bollywood Beats", screen: "Audi 2", time: "7:00 PM", sold: 165, capacity: 200 },
  { movie: "Starlight Circus", screen: "IMAX", time: "5:00 PM", sold: 210, capacity: 240 },
];

export default function TheatreDashboard() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Theatre dashboard</h1>
        <p className="text-muted-foreground mt-1">PVR ICON Andheri · Partner portal</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today revenue" value={formatCurrency(186400)} />
        <StatCard label="Tickets sold" value={517} />
        <StatCard label="Occupancy" value="78%" />
        <StatCard label="Active shows" value={12} />
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-4">Tonight&apos;s shows</h2>
        <div className="space-y-3">
          {SHOWS.map((s) => (
            <div
              key={s.movie + s.time}
              className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{s.movie}</p>
                <p className="text-sm text-muted-foreground">
                  {s.screen} · {s.time}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {s.sold}/{s.capacity}
                </span>
                <Badge variant="success">
                  {Math.round((s.sold / s.capacity) * 100)}% sold
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-2">Pricing rules</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>· Peak: Fri–Sun +20% after 6 PM</li>
          <li>· Weekend recliner surcharge ₹50</li>
          <li>· Holiday calendar synced · Independence Day surge active</li>
        </ul>
      </section>
    </div>
  );
}
