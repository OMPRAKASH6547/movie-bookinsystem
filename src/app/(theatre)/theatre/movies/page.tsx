"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function OwnerMoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    duration: "150",
    languages: "Hindi",
    genres: "Action",
    certification: "UA",
    trailerUrl: "",
    poster: "",
    rating: "7.5",
    releaseDate: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    const { data } = await api.get("/owner/movies");
    setMovies(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load movies"));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader title="Movie management" subtitle="Add titles with poster, trailer, rating & certificate" />

      <form
        className="grid sm:grid-cols-2 gap-3 rounded-xl border border-border p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.post("/owner/movies", {
              ...form,
              duration: Number(form.duration),
              rating: Number(form.rating),
              languages: form.languages.split(",").map((s) => s.trim()),
              genres: form.genres.split(",").map((s) => s.trim()),
            });
            toast.success("Movie added");
            load();
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed");
          }
        }}
      >
        <Input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <Input
          placeholder="Duration (minutes)"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
          required
        />
        <Input
          placeholder="Languages"
          value={form.languages}
          onChange={(e) => setForm({ ...form, languages: e.target.value })}
        />
        <Input
          placeholder="Genres"
          value={form.genres}
          onChange={(e) => setForm({ ...form, genres: e.target.value })}
        />
        <Input
          placeholder="Certificate (U/UA/A)"
          value={form.certification}
          onChange={(e) => setForm({ ...form, certification: e.target.value })}
        />
        <Input
          placeholder="Rating"
          value={form.rating}
          onChange={(e) => setForm({ ...form, rating: e.target.value })}
        />
        <Input
          placeholder="Poster URL"
          value={form.poster}
          onChange={(e) => setForm({ ...form, poster: e.target.value })}
          className="sm:col-span-2"
        />
        <Input
          placeholder="Trailer URL"
          value={form.trailerUrl}
          onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
          className="sm:col-span-2"
        />
        <Input
          type="date"
          value={form.releaseDate}
          onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
        />
        <Button type="submit">Add movie</Button>
      </form>

      <div className="grid sm:grid-cols-2 gap-3">
        {movies.map((m) => (
          <div key={m._id} className="rounded-xl border border-border p-4 flex gap-3">
            {m.poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.poster} alt="" className="h-24 w-16 object-cover rounded-md bg-muted" />
            )}
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-sm text-muted-foreground">
                {m.duration}m · {m.languages?.join(", ")} · {m.certification}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {(m.genres || []).slice(0, 3).map((g: string) => (
                  <Badge key={g} variant="outline">
                    {g}
                  </Badge>
                ))}
                {m.ownerId && <Badge>Owner catalog</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
