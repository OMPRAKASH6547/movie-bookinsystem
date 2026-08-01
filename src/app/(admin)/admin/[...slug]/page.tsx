"use client";

import { use } from "react";
import { StatCard } from "@/components/dashboard/stat-card";

const TITLES: Record<string, string> = {
  theatres: "Theatre management",
  bookings: "Booking management",
  users: "User management",
  coupons: "Coupon & offers",
  banners: "Advertisement banners",
  analytics: "Reports & analytics",
  audit: "Audit logs",
  settings: "Platform settings",
};

export default function AdminModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const key = slug[0] || "module";
  const title = TITLES[key] || key.replace(/-/g, " ");

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-display text-3xl tracking-tight capitalize">{title}</h1>
      <p className="text-muted-foreground">
        Full CRUD wired through repository → service → API (`/api/v1`). Connect MongoDB and use
        role-gated admin tokens to mutate live data.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Records" value="—" hint="Live after seed" />
        <StatCard label="Active" value="—" />
        <StatCard label="Pending actions" value="0" />
      </div>
      <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
        Module: <code className="text-foreground">{key}</code> · Permissions enforced via RBAC
        middleware · Audit trail on mutations
      </div>
    </div>
  );
}
