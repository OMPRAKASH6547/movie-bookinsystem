"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl tracking-tight">Profile</h1>
        <Badge>{user?.role || "guest"}</Badge>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input defaultValue={user?.name || ""} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input defaultValue={user?.email || ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Referral code</Label>
          <Input defaultValue="CINEPASS-REF" readOnly />
        </div>
        <Button onClick={() => toast.success("Profile updated")}>Save changes</Button>
      </div>

      <div className="rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-2">Membership</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Silver tier · 1.2× reward multiplier · Free cancellation once/month
        </p>
        <Button variant="accent">Upgrade to Gold</Button>
      </div>
    </div>
  );
}
