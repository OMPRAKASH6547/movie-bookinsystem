"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

interface CouponRow {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  usedCount?: number;
  isActive: boolean;
  description?: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("20");

  const load = async () => {
    const { data } = await api.get("/admin/coupons");
    setCoupons(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load coupons"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Coupon management" subtitle="Create and pause promotional codes" />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="NEWCODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-40"
        />
        <Input
          type="number"
          placeholder="%"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24"
        />
        <Button
          onClick={async () => {
            if (!code) return;
            await api.post("/admin/coupons", {
              code,
              discountType: "percentage",
              discountValue: Number(value),
              description: `${value}% off`,
            });
            toast.success("Coupon created");
            setCode("");
            load();
          }}
        >
          Add coupon
        </Button>
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
              <tr key={c._id || c.code} className="border-t border-border">
                <td className="p-3 font-mono font-semibold">{c.code}</td>
                <td className="p-3 capitalize">{c.discountType}</td>
                <td className="p-3">
                  {c.discountType === "fixed" ? `₹${c.discountValue}` : `${c.discountValue}%`}
                </td>
                <td className="p-3">{c.usedCount || 0}</td>
                <td className="p-3">
                  <Badge variant={c.isActive ? "success" : "outline"}>
                    {c.isActive ? "active" : "paused"}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await api.patch("/admin/coupons", {
                        id: c._id,
                        code: c.code,
                        isActive: !c.isActive,
                      });
                      toast.success("Updated");
                      load();
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
