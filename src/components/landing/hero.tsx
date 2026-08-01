"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import type { Movie } from "@/types";
import { formatDuration } from "@/utils/format";

export function Hero({ movie }: { movie: Movie }) {
  return (
    <section className="relative z-10 min-h-[100svh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={movie.backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--hero-overlay)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="container-page relative z-10 pb-16 pt-32 md:pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-tight leading-none mb-4 drop-shadow-lg">
            {APP_NAME}
          </p>
          <p className="text-white/80 text-lg md:text-xl mb-8 max-w-md leading-relaxed">
            {APP_TAGLINE}
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{movie.rating.toFixed(1)} ★</Badge>
            <Badge variant="outline" className="border-white/30 text-white/90">
              {movie.certification}
            </Badge>
            <span className="text-white/70 text-sm">{formatDuration(movie.duration)}</span>
            <span className="text-white/50 text-sm">·</span>
            <span className="text-white/70 text-sm">{movie.genres.slice(0, 2).join(", ")}</span>
          </div>

          <h1 className="text-white text-2xl md:text-3xl font-semibold mb-3 tracking-tight">
            {movie.title}
          </h1>
          <p className="text-white/65 text-sm md:text-base line-clamp-2 mb-8 max-w-lg">
            {movie.description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={`/book/${movie.slug}`}>
                <Ticket className="h-5 w-5" />
                Book tickets
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href={`/movies/${movie.slug}`}>
                <Play className="h-5 w-5" />
                Details
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
