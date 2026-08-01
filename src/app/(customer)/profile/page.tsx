"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

export default function ProfilePage() {
  const { user, setUser, accessToken } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api
      .get("/users/profile")
      .then((res) => {
        const p = res.data.data;
        setName(p.name || "");
        setPhone(p.phone || "");
        setReferral(p.referralCode || "");
        setPoints(p.rewardPoints || 0);
        if (user) {
          setUser({
            ...user,
            name: p.name,
            email: p.email,
            role: p.role,
            permissions: p.permissions || user.permissions,
          });
        }
      })
      .catch(() => {
        setName(user?.name || "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", { name, phone });
      if (user) setUser({ ...user, name: data.data.name });
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referral || "CINEPASS-REF");
    toast.success("Referral code copied");
  };

  const tier = points >= 500 ? "Gold" : points >= 100 ? "Silver" : "Bronze";

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile" subtitle="Manage your account & membership" />

      <div className="flex items-center gap-2">
        <Badge>{user?.role || "guest"}</Badge>
        <Badge variant="accent">{tier} member</Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Reward points" value={points} hint="Earn 1 pt per ₹10 spent" />
        <StatCard
          label="Membership"
          value={tier}
          hint={tier === "Gold" ? "1.5× rewards" : "Upgrade by earning points"}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
          />
        </div>
        <div className="space-y-2">
          <Label>Referral code</Label>
          <div className="flex gap-2">
            <Input value={referral} readOnly />
            <Button type="button" variant="outline" onClick={copyReferral}>
              Copy
            </Button>
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-2">Refer & earn</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Friends get ₹100 wallet credit. You earn 50 reward points per successful referral.
        </p>
        <Button variant="accent" onClick={copyReferral}>
          Share referral code
        </Button>
      </div>
    </div>
  );
}
