"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const INITIAL = [
  { code: "CINEPASS50", type: "percentage", value: 50, active: true, used: 128 },
  { code: "STUDENT20", type: "percentage", value: 20, active: true, used: 64 },
  { code: "WALLET150", type: "fixed", value: 150, active: true, used: 41 },
  { code: "BOGOWED", type: "percentage", value: 25, active: false, used: 12 },
];

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState(INITIAL);
  const [code, setCode] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Coupon management</h1>
        <div className="flex gap-2">
          <Input
            placeholder="NEWCODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-40"
          />
          <Button
            onClick={() => {
              if (!code) return;
              setCoupons((c) => [
                { code, type: "percentage", value: 10, active: true, used: 0 },
                ...c,
              ]);
              setCode("");
              toast.success("Coupon created");
            }}
          >
            Add coupon
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Type</th>
              <th className="p-3">Value</th>
              <th className="p-3">Used</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code} className="border-t border-border">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3 capitalize">{c.type}</td>
                <td className="p-3">{c.type === "fixed" ? `₹${c.value}` : `${c.value}%`}</td>
                <td className="p-3">{c.used}</td>
                <td className="p-3">
                  <Badge variant={c.active ? "success" : "outline"}>
                    {c.active ? "active" : "paused"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCoupons((list) =>
                        list.map((x) =>
                          x.code === c.code ? { ...x, active: !x.active } : x
                        )
                      );
                      toast.success("Coupon updated");
                    }}
                  >
                    Toggle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
