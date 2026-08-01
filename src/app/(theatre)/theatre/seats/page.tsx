"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

const ROWS = "ABCDEFGH".split("");
const COLS = 12;

type SeatType = "regular" | "premium" | "vip" | "recliner" | "blocked" | "maintenance";

export default function SeatLayoutBuilderPage() {
  const [seatTypes, setSeatTypes] = useState<Record<string, SeatType>>(() => {
    const map: Record<string, SeatType> = {};
    for (const r of ROWS) {
      for (let c = 1; c <= COLS; c++) {
        const id = `${r}${c}`;
        map[id] = r <= "B" ? "vip" : r <= "D" ? "premium" : "regular";
      }
    }
    return map;
  });
  const [brush, setBrush] = useState<SeatType>("premium");
  const [screenId, setScreenId] = useState<string | null>(null);
  const [screens, setScreens] = useState<any[]>([]);

  useEffect(() => {
    api.get("/owner/screens").then((res) => {
      const list = res.data.data || [];
      setScreens(list);
      if (list[0]?._id) setScreenId(list[0]._id);
    });
  }, []);

  const counts = useMemo(() => {
    const c = { regular: 0, premium: 0, vip: 0, recliner: 0, blocked: 0, maintenance: 0 };
    Object.values(seatTypes).forEach((t) => {
      c[t] += 1;
    });
    return c;
  }, [seatTypes]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Seat layout builder"
        subtitle="VIP / Premium / Regular · block seats · maintenance · dynamic row pricing"
      />
      {screens.length > 0 && (
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={screenId || ""}
          onChange={(e) => setScreenId(e.target.value)}
        >
          {screens.map((s) => (
            <option key={s._id} value={s._id}>
              {s.theatreId?.name ? `${s.theatreId.name} · ` : ""}
              {s.name} · {s.screenType}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-wrap gap-2">
        {(["regular", "premium", "vip", "recliner", "blocked", "maintenance"] as SeatType[]).map(
          (t) => (
          <Button
            key={t}
            size="sm"
            variant={brush === t ? "default" : "outline"}
            onClick={() => setBrush(t)}
            className="capitalize"
          >
            {t} ({counts[t]})
          </Button>
          )
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground mb-2">SCREEN</div>
      <div className="overflow-x-auto rounded-xl border border-border p-4 bg-card">
        <div className="inline-block space-y-1.5 min-w-full">
          {ROWS.map((row) => (
            <div key={row} className="flex items-center justify-center gap-1">
              <span className="w-5 text-xs font-mono text-muted-foreground">{row}</span>
              {Array.from({ length: COLS }, (_, i) => {
                const n = i + 1;
                const id = `${row}${n}`;
                const type = seatTypes[id];
                return (
                  <button
                    key={id}
                    type="button"
                    title={`${id} · ${type}`}
                    onClick={() => setSeatTypes((prev) => ({ ...prev, [id]: brush }))}
                    className={cn(
                      "seat !cursor-pointer",
                      type === "regular" && "seat-available",
                      type === "premium" && "seat-premium seat-available",
                      type === "vip" && "seat-recliner seat-available",
                      type === "recliner" && "seat-recliner seat-available",
                      (type === "blocked" || type === "maintenance") && "seat-booked",
                      (n === 3 || n === 9) && "ml-3"
                    )}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant="outline">
          Capacity{" "}
          {
            Object.values(seatTypes).filter((t) => t !== "blocked" && t !== "maintenance")
              .length
          }
        </Badge>
        <Button
          onClick={async () => {
            localStorage.setItem("cinepass-seat-layout", JSON.stringify(seatTypes));
            const seats = Object.entries(seatTypes).map(([id, type]) => {
              const row = id.replace(/\d+/g, "");
              const number = Number(id.replace(/\D+/g, ""));
              const status =
                type === "blocked" || type === "maintenance" ? type : "available";
              const seatType =
                type === "blocked" || type === "maintenance" ? "regular" : type;
              return {
                id,
                row,
                number,
                type: seatType,
                price:
                  seatType === "vip" || seatType === "recliner"
                    ? 500
                    : seatType === "premium"
                      ? 350
                      : 220,
                isAvailable: status === "available",
                status,
                isAisle: number === 3 || number === 9,
              };
            });
            if (screenId && !String(screenId).startsWith("scr_demo")) {
              try {
                await api.patch("/owner/screens", {
                  id: screenId,
                  seatLayout: { rows: ROWS.length, columns: COLS, seats },
                  capacity: seats.filter((s) => s.isAvailable).length,
                });
                toast.success("Layout saved to screen");
                return;
              } catch {
                /* local fallback */
              }
            }
            toast.success("Seat layout saved locally");
          }}
        >
          Save layout
        </Button>
      </div>
    </div>
  );
}
