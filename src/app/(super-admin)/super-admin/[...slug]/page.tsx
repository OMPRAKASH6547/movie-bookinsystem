"use client";

import { use } from "react";

export default function SuperAdminModule({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  return (
    <div className="max-w-3xl space-y-3">
      <h1 className="font-display text-3xl tracking-tight capitalize">
        {slug.join(" · ").replace(/-/g, " ")}
      </h1>
      <p className="text-muted-foreground text-sm">
        Multi-tenant billing, commissions, feature flags, and support tooling for the CinePass SaaS
        control plane.
      </p>
    </div>
  );
}
