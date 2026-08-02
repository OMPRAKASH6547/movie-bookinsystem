"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { TableSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { ErrorState } from "@/components/loading/error-state";
import { toast } from "sonner";

export default function CollectionPage() {
  const [data, setData] = useState<JsonRecord | null>(null);
  const [theatres, setTheatres] = useState<JsonRecord[]>([]);
  const [staff, setStaff] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filters, setFilters] = useState({
    from: new Date().toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    theatreId: "",
    staffId: "",
    counterId: "",
    shift: "",
  });
  const [handover, setHandover] = useState({
    theatreId: "",
    counterId: "COUNTER-1",
    openingCash: "0",
    closingCash: "0",
    note: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await api.get("/owner/collection", { params: filters });
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/owner/theatres").then((r) => {
      const list = r.data.data || [];
      setTheatres(list);
      if (list[0]) setHandover((h) => ({ ...h, theatreId: list[0]._id }));
    });
    api
      .get("/owner/collection", { params: { view: "staff" } })
      .then((r) => setStaff(r.data.data || []))
      .catch(() => null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get("/owner/collection", {
        params: { format: "csv", ...filters },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "collection-report.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported");
    } catch {
      toast.error("Export failed");
    }
  };

  const submitHandover = async () => {
    try {
      await api.post("/owner/collection", {
        action: "handover",
        ...handover,
        openingCash: Number(handover.openingCash),
        closingCash: Number(handover.closingCash),
        shift: filters.shift || undefined,
      });
      toast.success("Cash handover submitted");
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Handover failed"));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.post("/owner/collection", { action: "status", id, status });
      toast.success(`Marked ${status}`);
      load();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Update failed"));
    }
  };

  const totals = data?.totals;
  const compare = data?.comparison;

  return (
    <div className="space-y-8 max-w-7xl">
      <PageHeader
        title="Collection management"
        subtitle="Counter collections · compare · pending settlements · cash handover"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              CSV / Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              PDF
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.theatreId}
          onChange={(e) => setFilters({ ...filters, theatreId: e.target.value })}
        >
          <option value="">All theatres</option>
          {theatres.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.staffId}
          onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="Counter"
          value={filters.counterId}
          onChange={(e) => setFilters({ ...filters, counterId: e.target.value })}
        />
        <select
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={filters.shift}
          onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
        >
          <option value="">All shifts</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
          <option value="night">Night</option>
        </select>
      </div>
      <Button className="print:hidden" onClick={load}>
        Refresh
      </Button>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Stat label="Tickets" value={String(totals?.ticketsSold || 0)} />
            <Stat label="Collection" value={formatCurrency(totals?.revenue || 0)} />
            <Stat label="Discounts" value={formatCurrency(totals?.discounts || 0)} />
            <Stat label="Refunds" value={formatCurrency(totals?.refunds || 0)} />
            <Stat
              label="vs prior period"
              value={
                compare?.changePct == null
                  ? "—"
                  : `${compare.changePct > 0 ? "+" : ""}${compare.changePct}%`
              }
            />
          </div>

          <section className="space-y-3">
            <h2 className="font-semibold text-lg">Compare counters</h2>
            {!data?.byCounter?.length ? (
              <EmptyState variant="revenue" title="No collections yet" />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Staff</th>
                      <th className="p-3">Counter</th>
                      <th className="p-3">Tickets</th>
                      <th className="p-3">Revenue</th>
                      <th className="p-3">Discounts</th>
                      <th className="p-3">Coupons</th>
                      <th className="p-3">Cash / Card / UPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byCounter.map((c: JsonRecord) => (
                      <tr key={c.key} className="border-t border-border">
                        <td className="p-3 font-medium">{c.staffName}</td>
                        <td className="p-3">{c.counterId}</td>
                        <td className="p-3">{c.ticketsSold}</td>
                        <td className="p-3">{formatCurrency(c.revenue)}</td>
                        <td className="p-3">{formatCurrency(c.discounts)}</td>
                        <td className="p-3">{c.couponsUsed}</td>
                        <td className="p-3 text-xs">
                          {formatCurrency(c.byPayment.cash || 0)} /{" "}
                          {formatCurrency(c.byPayment.card || 0)} /{" "}
                          {formatCurrency(c.byPayment.upi || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3 print:hidden">
            <h2 className="font-semibold text-lg">Pending settlements & cash handover</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-medium">Submit cash handover</p>
                <select
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  value={handover.theatreId}
                  onChange={(e) => setHandover({ ...handover, theatreId: e.target.value })}
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Counter ID"
                  value={handover.counterId}
                  onChange={(e) => setHandover({ ...handover, counterId: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Opening cash"
                    value={handover.openingCash}
                    onChange={(e) => setHandover({ ...handover, openingCash: e.target.value })}
                  />
                  <Input
                    placeholder="Closing cash"
                    value={handover.closingCash}
                    onChange={(e) => setHandover({ ...handover, closingCash: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Note"
                  value={handover.note}
                  onChange={(e) => setHandover({ ...handover, note: e.target.value })}
                />
                <Button onClick={submitHandover}>Submit handover</Button>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3 max-h-96 overflow-auto">
                {!data?.pendingSettlements?.length && (
                  <p className="text-sm text-muted-foreground">No pending settlements</p>
                )}
                {data?.pendingSettlements?.map((p: JsonRecord) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {p.staffName} · {p.counterId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.theatre} · {new Date(p.date).toLocaleString("en-IN")} · {p.shift}
                      </p>
                      <p className="text-xs">
                        Expected {formatCurrency(p.expectedCash)} · Variance{" "}
                        {formatCurrency(p.variance)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {p.handoverStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "accepted")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, "disputed")}>
                        Dispute
                      </Button>
                      <Button size="sm" onClick={() => updateStatus(p.id, "settled")}>
                        Settle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
