"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";
import { ErrorState } from "@/components/loading/error-state";

export default function CustomerSearchPage() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<JsonRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { data } = await api.get("/pos/customers", { params: { q } });
      setResult(data.data);
    } catch (e: unknown) {
      setError(e);
      toast.error(apiErrorMessage(e, "Search failed"));
    } finally {
      setLoading(false);
    }
  };

  const empty =
    searched &&
    !loading &&
    !error &&
    !result?.users?.length &&
    !result?.recentBookings?.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Customer search"
        subtitle="Find walk-in / existing customers by name, phone, or email"
      />
      <div className="flex gap-2">
        <Input
          placeholder="Name, phone or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} loading={loading} loadingText="Searching…">
          Search
        </Button>
      </div>

      {loading && <ListSkeleton count={3} />}
      {error && !loading && <ErrorState onRetry={search} />}
      {empty && <EmptyState variant="customers" />}

      {result && !loading && !error && (
        <div className="space-y-4">
          <section>
            <h3 className="font-semibold mb-2">Profiles</h3>
            <div className="space-y-2">
              {(result.users || []).map((u: JsonRecord) => (
                <div key={u._id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-muted-foreground">
                    {u.phone || "—"} · {u.email} · {u.rewardPoints || 0} pts
                  </p>
                </div>
              ))}
              {!result.users?.length && (
                <p className="text-sm text-muted-foreground">No profiles matched</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="font-semibold mb-2">Recent bookings</h3>
            <div className="space-y-2">
              {(result.recentBookings || []).map((b: JsonRecord) => (
                <div
                  key={b._id}
                  className="rounded-xl border border-border p-3 text-sm flex justify-between"
                >
                  <div>
                    <p className="font-medium">{b.customerName || "Guest"}</p>
                    <p className="text-muted-foreground">{b.customerPhone}</p>
                  </div>
                  <p>{formatCurrency(b.finalAmount || 0)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
