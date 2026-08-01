"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

export default function TheatrePricingPage() {
  const [regular, setRegular] = useState("220");
  const [premium, setPremium] = useState("320");
  const [recliner, setRecliner] = useState("450");
  const [peak, setPeak] = useState("20");
  const [weekend, setWeekend] = useState("15");
  const [holiday, setHoliday] = useState("25");

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Pricing rules" subtitle="Base, peak, weekend and holiday surcharges" />

      <div className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Base seat prices (₹)</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Regular</Label>
            <Input value={regular} onChange={(e) => setRegular(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Premium</Label>
            <Input value={premium} onChange={(e) => setPremium(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Recliner</Label>
            <Input value={recliner} onChange={(e) => setRecliner(e.target.value)} />
          </div>
        </div>

        <h2 className="font-semibold pt-2">Surcharges (%)</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Peak (after 6 PM)</Label>
            <Input value={peak} onChange={(e) => setPeak(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Weekend</Label>
            <Input value={weekend} onChange={(e) => setWeekend(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Holiday</Label>
            <Input value={holiday} onChange={(e) => setHoliday(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="outline">Fri–Sun +{weekend}%</Badge>
          <Badge variant="outline">Peak +{peak}%</Badge>
          <Badge variant="accent">Holiday +{holiday}%</Badge>
        </div>

        <Button
          onClick={() => {
            localStorage.setItem(
              "cinepass-theatre-pricing",
              JSON.stringify({ regular, premium, recliner, peak, weekend, holiday })
            );
            toast.success("Pricing rules saved");
          }}
        >
          Save pricing
        </Button>
      </div>
    </div>
  );
}
