"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function TicketVerifyPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);

  const verify = async (exit = false) => {
    try {
      const { data } = await api.post("/pos/verify", { code: code.trim(), exit });
      setResult(data.data);
      if (data.data.result === "valid") toast.success(data.data.message);
      else toast.error(data.data.message || data.data.result);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verify failed");
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader
        title="Ticket checker"
        subtitle="Scan QR / barcode or enter booking number · duplicate detection"
      />

      <div className="rounded-xl border border-border p-6 space-y-4">
        <Input
          placeholder="Scan or type booking number / barcode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && verify(false)}
          autoFocus
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => verify(false)}>
            Verify entry
          </Button>
          <Button variant="outline" onClick={() => verify(true)}>
            Record exit
          </Button>
        </div>

        {result && (
          <div className="rounded-lg bg-muted/40 p-4 space-y-2">
            <Badge variant={result.result === "valid" ? "success" : "outline"}>
              {result.result}
            </Badge>
            <p className="text-sm">{result.message}</p>
            {result.booking && (
              <>
                <p className="font-medium">{result.booking.bookingNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Seats:{" "}
                  {result.booking.seats
                    ?.filter((s: any) => !s.cancelled)
                    .map((s: any) => s.seatId)
                    .join(", ")}
                </p>
                {result.entryAt && (
                  <p className="text-xs text-muted-foreground">
                    Entry: {new Date(result.entryAt).toLocaleString("en-IN")}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
