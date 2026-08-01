"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TXNS = [
  { id: 1, type: "credit", desc: "Welcome bonus", amount: "+₹100", date: "Jul 1" },
  { id: 2, type: "debit", desc: "Booking Neon Horizon", amount: "-₹648", date: "Jul 28" },
  { id: 3, type: "credit", desc: "Refund Shadow Protocol", amount: "+₹320", date: "Jul 21" },
];

export default function WalletPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-3xl tracking-tight">Wallet</h1>
      <StatCard label="Available balance" value="₹100" hint="Instant pay at checkout" />

      <div className="flex gap-2">
        <Input placeholder="Amount to add" type="number" min={100} />
        <Button onClick={() => toast.success("Top-up initiated via Razorpay/Stripe")}>
          Add money
        </Button>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Gift card</h2>
        <div className="flex gap-2">
          <Input placeholder="Enter gift card code" />
          <Button variant="outline" onClick={() => toast.success("Gift card applied")}>
            Redeem
          </Button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Transactions</h2>
        <ul className="space-y-2">
          {TXNS.map((t) => (
            <li
              key={t.id}
              className="flex justify-between rounded-lg border border-border px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{t.desc}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
              <span className={t.type === "credit" ? "text-emerald-500 font-semibold" : "font-semibold"}>
                {t.amount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
