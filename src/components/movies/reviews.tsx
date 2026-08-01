"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
}

export function MovieReviews({ movieId }: { movieId: string }) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(8);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    api
      .get("/reviews", { params: { movieId } })
      .then((res) => setReviews(res.data.data || []))
      .catch(() => setReviews([]));
  }, [movieId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Sign in to write a review");
      return;
    }
    try {
      const { data } = await api.post("/reviews", { movieId, rating, title, content });
      setReviews((r) => [data.data, ...r]);
      setTitle("");
      setContent("");
      toast.success("Review posted");
    } catch {
      toast.error("Could not post review");
    }
  };

  return (
    <section className="mt-12 max-w-2xl">
      <h2 className="font-semibold text-xl mb-4">Reviews & ratings</h2>

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-border p-4 mb-6">
        <div className="flex gap-3 items-center">
          <label className="text-sm">Rating</label>
          <Input
            type="number"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <Input
          placeholder="Headline"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          placeholder="Share your thoughts…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <Button type="submit" size="sm">
          Post review
        </Button>
      </form>

      <ul className="space-y-3">
        {reviews.length === 0 ? (
          <li className="text-sm text-muted-foreground">No reviews yet — be the first.</li>
        ) : (
          reviews.map((r) => (
            <li key={r._id} className="rounded-xl border border-border p-4">
              <div className="flex justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{r.title}</p>
                <span className="text-accent text-sm font-semibold">★ {r.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{r.content}</p>
              <p className="text-xs text-muted-foreground">
                {r.userName} · {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
