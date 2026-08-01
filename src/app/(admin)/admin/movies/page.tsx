"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { PageHeader } from "@/components/dashboard/page-header";

interface MovieRow {
  _id: string;
  title: string;
  status: string;
  rating: number;
  languages: string[];
  poster?: string;
  duration?: number;
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [title, setTitle] = useState("");
  const [poster, setPoster] = useState(
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop"
  );
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await api.get("/admin/movies", { params: { q: q || undefined } });
    setMovies(data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error("Failed to load movies"));
  }, []);

  const create = async () => {
    if (!title) return toast.error("Title required");
    setLoading(true);
    try {
      await api.post("/admin/movies", {
        title,
        poster,
        description: `${title} — added from admin panel`,
        genres: ["Drama"],
        languages: ["Hindi"],
        duration: 130,
        status: "upcoming",
      });
      toast.success("Movie created");
      setTitle("");
      await load();
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Create failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (m: MovieRow) => {
    const status = m.status === "now_showing" ? "archived" : "now_showing";
    try {
      await api.patch("/admin/movies", { id: m._id, status });
      toast.success("Status updated");
      await load();
    } catch {
      toast.error("Update failed (seed movies are read-only without Mongo id)");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/movies?id=${id}`);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Movie management" subtitle="Create, publish and archive titles" />

      <div className="rounded-xl border border-border p-4 grid md:grid-cols-4 gap-3">
        <Input placeholder="Movie title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Poster URL" value={poster} onChange={(e) => setPoster(e.target.value)} />
        <Button onClick={create} disabled={loading}>
          Add movie
        </Button>
        <div className="flex gap-2">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button variant="outline" onClick={() => load()}>
            Search
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Languages</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m._id} className="border-t border-border">
                <td className="p-3 font-medium">{m.title}</td>
                <td className="p-3">
                  <Badge variant="outline">{String(m.status).replace("_", " ")}</Badge>
                </td>
                <td className="p-3">{m.rating}</td>
                <td className="p-3 text-muted-foreground">{(m.languages || []).join(", ")}</td>
                <td className="p-3 space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(m)}>
                    Toggle
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(m._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
