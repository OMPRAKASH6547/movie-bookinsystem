"use client";
import { apiErrorMessage, type JsonRecord } from "@/types/ui";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function OwnersPage() {
  const [owners, setOwners] = useState<JsonRecord[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("Growth");

  const load = async () => {
    const { data } = await api.get("/super-admin/owners");
    setOwners(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load owners"));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Theater owner onboarding"
        subtitle="Approve owners, manage subscriptions, suspend accounts"
      />

      <form
        className="grid sm:grid-cols-4 gap-3 rounded-xl border border-border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post("/super-admin/owners", {
              name,
              email,
              subscriptionPlan: plan,
              approved: true,
            });
            toast.success("Owner onboarded (password: Password1)");
            setName("");
            setEmail("");
            load();
          } catch (err: unknown) {
            toast.error(apiErrorMessage(err, "Failed"));
          }
        }}
      >
        <Input placeholder="Owner name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input placeholder="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
        <Button type="submit">Onboard owner</Button>
      </form>

      <div className="space-y-3">
        {owners.map((o) => (
          <div
            key={o._id}
            className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <p className="font-medium">{o.name}</p>
              <p className="text-sm text-muted-foreground">
                {o.email} · {o.subscriptionPlan || "Starter"} · {o.theatreCount || 0} theatres
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={o.ownerStatus === "approved" ? "success" : "outline"}>
                {o.ownerStatus || "approved"}
              </Badge>
              {(["approved", "suspended", "rejected"] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await api.patch("/super-admin/owners", { id: o._id, status });
                    toast.success(`Marked ${status}`);
                    load();
                  }}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
