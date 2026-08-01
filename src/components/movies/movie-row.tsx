"use client";

import { MovieCard } from "./movie-card";
import type { Movie } from "@/types";

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  id?: string;
}

export function MovieRow({ title, subtitle, movies, id }: MovieRowProps) {
  if (!movies.length) return null;

  return (
    <section id={id} className="relative z-10 py-8 md:py-10">
      <div className="container-page mb-5">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      <div className="container-page">
        <div className="movie-row scrollbar-hide">
          {movies.map((movie, i) => (
            <MovieCard key={movie._id} movie={movie} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
