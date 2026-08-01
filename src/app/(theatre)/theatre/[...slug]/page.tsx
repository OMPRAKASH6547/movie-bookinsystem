"use client";

import { use } from "react";

export default function TheatreModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const title = slug.join(" / ").replace(/-/g, " ");

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-display text-3xl tracking-tight capitalize">{title}</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Theatre owner tools for screens, seat layout builder, show scheduling, peak/weekend/holiday
        pricing, staff RBAC, and revenue analytics — backed by Screen, Show, and Booking services.
      </p>
    </div>
  );
}
