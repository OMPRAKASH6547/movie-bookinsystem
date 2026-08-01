"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

const ROWS = "ABCDEFGH".split("");
const COLS = 12;

type SeatType = "regular" | "premium" | "recliner" | "blocked";

export default function SeatLayoutBuilderPage() {
  const [seatTypes, setSeatTypes] = useState<Record<string, SeatType>>(() => {
    const map: Record<string, SeatType> = {};
    for (const r of ROWS) {
      for (let c = 1; c <= COLS; c++) {
        const id = `${r}${c}`;
        map[id] = r <= "B" ? "recliner" : r <= "D" ? "premium" : "regular";
      }
    }
    return map;
  });
  const [brush, setBrush] = useState<SeatType>("premium");

  const counts = useMemo(() => {
    const c = { regular: 0, premium: 0, recliner: 0, blocked: 0 };
    Object.values(seatTypes).forEach((t) => {
      c[t] += 1;
    });
    return c;
  }, [seatTypes]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Seat layout builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paint seat types for Audi 1 · changes persist after you save
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["regular", "premium", "recliner", "blocked"] as SeatType[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={brush === t ? "default" : "outline"}
            onClick={() => setBrush(t)}
            className="capitalize"
          >
            {t} ({counts[t]})
          </Button>
        ))}
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
                      type === "recliner" && "seat-recliner seat-available",
                      type === "blocked" && "seat-booked",
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
        <Badge variant="outline">Capacity {Object.values(seatTypes).filter((t) => t !== "blocked").length}</Badge>
        <Button
          onClick={() => {
            localStorage.setItem("cinepass-seat-layout", JSON.stringify(seatTypes));
            toast.success("Seat layout saved");
          }}
        >
          Save layout
        </Button>
      </div>
    </div>
  );
}
