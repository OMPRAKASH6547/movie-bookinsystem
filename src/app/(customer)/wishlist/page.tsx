"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SEED_MOVIES } from "@/data/movies";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import type { Movie } from "@/types";

export default function WishlistPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [items, setItems] = useState<Movie[]>(SEED_MOVIES.filter((m) => m.isFeatured).slice(0, 4));

  useEffect(() => {
    api
      .get("/wishlist")
      .then((res) => {
        if (res.data?.data?.length) setItems(res.data.data);
      })
      .catch(() => {
        /* keep seed */
      });
  }, [token]);

  const remove = async (movieId: string) => {
    try {
      await api.post("/wishlist", { movieId, action: "remove" });
      setItems((prev) => prev.filter((m) => m._id !== movieId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Sign in to manage wishlist");
    }
  };

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
                {m.genres?.slice(0, 2).join(" · ")} · ★ {m.rating}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => remove(m._id)}>
                Remove
              </Button>
              <Button size="sm" asChild>
                <Link href={`/book/${m.slug}`}>Book</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
