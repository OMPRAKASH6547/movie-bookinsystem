"use client";

import Link from "next/link";
import { SEED_MOVIES } from "@/data/movies";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const items = SEED_MOVIES.filter((m) => m.isFeatured).slice(0, 4);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl tracking-tight">Wishlist</h1>
      <div className="space-y-3">
        {items.map((m) => (
          <div
            key={m._id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
          >
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-sm text-muted-foreground">
                {m.genres.slice(0, 2).join(" · ")} · ★ {m.rating}
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href={`/book/${m.slug}`}>Book</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
