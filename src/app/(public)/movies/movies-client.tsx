"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MovieCard } from "@/components/movies/movie-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEED_MOVIES } from "@/data/movies";
import { GENRES, LANGUAGES } from "@/constants";
import { api } from "@/lib/api/client";
import type { Movie } from "@/types";
import { MovieGridSkeleton } from "@/components/loading/skeletons";
import { EmptyState } from "@/components/loading/empty-state";

export function MoviesClient() {
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>(SEED_MOVIES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "");
  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get("/movies", {
          params: {
            search: search || undefined,
            genre: genre || undefined,
            language: language || undefined,
            status: status || undefined,
            limit: 50,
          },
        });
        if (!cancelled && data?.data?.length) setMovies(data.data);
      } catch {
        if (!cancelled) {
          let filtered = [...SEED_MOVIES];
          if (status) filtered = filtered.filter((m) => m.status === status);
          if (genre) filtered = filtered.filter((m) => m.genres.includes(genre));
          if (language) filtered = filtered.filter((m) => m.languages.includes(language));
          if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter((m) => m.title.toLowerCase().includes(q));
          }
          setMovies(filtered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, genre, language, status]);

  const title = useMemo(() => {
    if (status === "upcoming") return "Coming soon";
    if (genre) return genre;
    if (search) return `Results for “${search}”`;
    return "All movies";
  }, [status, genre, search]);

  return (
    <div className="container-page py-10 relative z-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground mb-8">Filter by genre, language, or status</p>

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <Input
          placeholder="Search movies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="lg:max-w-sm"
          aria-label="Search movies"
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={!status ? "default" : "outline"} onClick={() => setStatus("")}>
            All
          </Button>
          <Button
            size="sm"
            variant={status === "now_showing" ? "default" : "outline"}
            onClick={() => setStatus("now_showing")}
          >
            Now showing
          </Button>
          <Button
            size="sm"
            variant={status === "upcoming" ? "default" : "outline"}
            onClick={() => setStatus("upcoming")}
          >
            Upcoming
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {GENRES.map((g) => (
          <button key={g} type="button" onClick={() => setGenre(genre === g ? "" : g)}>
            <Badge variant={genre === g ? "default" : "outline"}>{g}</Badge>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-10">
        {LANGUAGES.map((l) => (
          <button key={l} type="button" onClick={() => setLanguage(language === l ? "" : l)}>
            <Badge variant={language === l ? "accent" : "outline"}>{l}</Badge>
          </button>
        ))}
      </div>

      {loading ? (
        <MovieGridSkeleton count={10} />
      ) : movies.length === 0 ? (
        <EmptyState
          variant="movies"
          title="No movies match your filters"
          description="Try clearing genre or language filters to see more titles."
          actionLabel="Clear filters"
          onAction={() => {
            setGenre("");
            setLanguage("");
            setStatus("");
            setSearch("");
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 justify-items-center sm:justify-items-start">
          {movies.map((movie, i) => (
            <MovieCard key={movie._id} movie={movie} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
