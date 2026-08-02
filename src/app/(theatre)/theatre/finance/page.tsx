"use client";
import type { JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";
import { StatGridSkeleton, ListSkeleton } from "@/components/loading/skeletons";
import { ErrorState } from "@/components/loading/error-state";

export default function FinancePage() {
  const [tab, setTab] = useState<"gst" | "settlement" | "expenses" | "cash">("gst");
  const [gst, setGst] = useState<JsonRecord | null>(null);
  const [settlement, setSettlement] = useState<JsonRecord[]>([]);
  const [expenses, setExpenses] = useState<JsonRecord[]>([]);
  const [closings, setClosings] = useState<JsonRecord[]>([]);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    theatreId: "",
    category: "Utilities",
    amount: "",
    note: "",
  });
  const [cashForm, setCashForm] = useState({
    theatreId: "",
    counterId: "COUNTER-1",
    openingCash: "5000",
    closingCash: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, g, s, e, c] = await Promise.all([
        api.get("/owner/theatres"),
        api.get("/owner/finance", { params: { type: "gst" } }),
        api.get("/owner/finance", { params: { type: "settlement" } }),
        api.get("/owner/finance", { params: { type: "expenses" } }),
        api.get("/owner/finance", { params: { type: "cash-closing" } }),
      ]);
      setTheatres(t.data.data || []);
      setGst(g.data.data);
      setSettlement(s.data.data || []);
      setExpenses(e.data.data || []);
      setClosings(c.data.data || []);
      if (t.data.data?.[0]) {
        setExpenseForm((f) => ({ ...f, theatreId: f.theatreId || t.data.data[0]._id }));
        setCashForm((f) => ({ ...f, theatreId: f.theatreId || t.data.data[0]._id }));
      }
    } catch (err) {
      setError(err);
      toast.error("Failed to load finance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl">
        <PageHeader title="Finance" subtitle="GST, settlements, expenses, daily cash closing" />
        <StatGridSkeleton count={4} />
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-5xl">
        <PageHeader title="Finance" subtitle="GST, settlements, expenses, daily cash closing" />
        <ErrorState onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader title="Finance" subtitle="GST, settlements, expenses, daily cash closing" />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["gst", "GST report"],
            ["settlement", "Settlements"],
            ["expenses", "Expenses"],
            ["cash", "Cash closing"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "gst" && gst && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-4 gap-4">
            <StatCard label="Taxable" value={formatCurrency(gst.taxableValue || 0)} />
            <StatCard label="CGST" value={formatCurrency(gst.cgst || 0)} />
            <StatCard label="SGST" value={formatCurrency(gst.sgst || 0)} />
            <StatCard label="Total tax" value={formatCurrency(gst.totalTax || 0)} />
          </div>
          <p className="text-sm text-muted-foreground">{gst.invoiceCount} invoices in range</p>
        </div>
      )}

      {tab === "settlement" && (
        <div className="space-y-3">
          {settlement.map((s) => (
            <div key={s.theatreId} className="rounded-xl border border-border p-4">
              <p className="font-medium">{s.theatreName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Gross {formatCurrency(s.gross)} · Commission {formatCurrency(s.platformCommission)} ·
                Net online settlement {formatCurrency(s.netSettlement)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "expenses" && (
        <div className="space-y-4">
          <form
            className="grid sm:grid-cols-4 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await api.post("/owner/finance", {
                  type: "expense",
                  ...expenseForm,
                  amount: Number(expenseForm.amount),
                });
                toast.success("Expense added");
                load();
              } finally {
                setSaving(false);
              }
            }}
          >
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={expenseForm.theatreId}
              onChange={(e) => setExpenseForm({ ...expenseForm, theatreId: e.target.value })}
            >
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Category"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            />
            <Input
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />
            <Button type="submit" loading={saving} loadingText="Saving…">
              Add
            </Button>
          </form>
          {expenses.map((x) => (
            <div key={x._id} className="flex justify-between border-b border-border py-2 text-sm">
              <span>
                {x.category} · {new Date(x.date).toLocaleDateString("en-IN")}
              </span>
              <span>{formatCurrency(x.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "cash" && (
        <div className="space-y-4">
          <form
            className="grid sm:grid-cols-2 gap-3 rounded-xl border border-border p-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await api.post("/owner/finance", {
                  type: "cash-closing",
                  ...cashForm,
                  openingCash: Number(cashForm.openingCash),
                  closingCash: Number(cashForm.closingCash),
                });
                toast.success("Cash closing saved");
                load();
              } finally {
                setSaving(false);
              }
            }}
          >
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={cashForm.theatreId}
              onChange={(e) => setCashForm({ ...cashForm, theatreId: e.target.value })}
            >
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Counter ID"
              value={cashForm.counterId}
              onChange={(e) => setCashForm({ ...cashForm, counterId: e.target.value })}
            />
            <Input
              placeholder="Opening cash"
              value={cashForm.openingCash}
              onChange={(e) => setCashForm({ ...cashForm, openingCash: e.target.value })}
            />
            <Input
              placeholder="Closing cash"
              value={cashForm.closingCash}
              onChange={(e) => setCashForm({ ...cashForm, closingCash: e.target.value })}
              required
            />
            <Button
              type="submit"
              className="sm:col-span-2"
              loading={saving}
              loadingText="Closing…"
            >
              Close counter
            </Button>
          </form>
          {closings.map((c) => (
            <div key={c._id} className="rounded-xl border border-border p-4 text-sm">
              <p className="font-medium">
                {c.theatreId?.name || "Theatre"} · {c.counterId}
              </p>
              <p className="text-muted-foreground">
                Expected {formatCurrency(c.expectedCash)} · Actual {formatCurrency(c.closingCash)} ·
                Variance {formatCurrency(c.variance)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
