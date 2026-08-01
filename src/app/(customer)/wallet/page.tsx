"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { useAuthStore } from "@/stores/auth.store";

interface Txn {
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  balanceAfter?: number;
}

export default function WalletPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [balance, setBalance] = useState(0);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState("500");
  const [gift, setGift] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/wallet");
      setBalance(data.data.wallet.balance);
      setTxns(data.data.transactions || []);
    } catch {
      setBalance(100);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const topup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/wallet", { amount: Number(amount), type: "topup" });
      setBalance(data.data.wallet.balance);
      toast.success("Wallet topped up");
      await load();
    } catch {
      toast.error("Top-up failed — sign in first");
    } finally {
      setLoading(false);
    }
  };

  const redeem = async () => {
    try {
      const { data } = await api.post("/wallet", { type: "giftcard", code: gift });
      setBalance(data.data.wallet.balance);
      toast.success(`Gift card applied (+${formatCurrency(data.data.credited)})`);
      setGift("");
      await load();
    } catch {
      toast.error("Invalid gift card — try GIFT500");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-3xl tracking-tight">Wallet</h1>
      <StatCard
        label="Available balance"
        value={formatCurrency(balance)}
        hint="Use at checkout · instant refunds land here"
      />

      <div className="flex gap-2">
        <Input
          placeholder="Amount to add"
          type="number"
          min={100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button onClick={topup} disabled={loading}>
          Add money
        </Button>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Gift card</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Enter gift card code"
            value={gift}
            onChange={(e) => setGift(e.target.value)}
          />
          <Button variant="outline" onClick={redeem}>
            Redeem
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Demo code: GIFT500</p>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Transactions</h2>
        <ul className="space-y-2">
          {txns.length === 0 ? (
            <li className="text-sm text-muted-foreground">No transactions yet</li>
          ) : (
            txns.map((t, i) => (
              <li
                key={i}
                className="flex justify-between rounded-lg border border-border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span
                  className={
                    t.type === "credit" ? "text-emerald-500 font-semibold" : "font-semibold"
                  }
                >
                  {t.type === "credit" ? "+" : "-"}
                  {formatCurrency(Math.abs(t.amount))}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
