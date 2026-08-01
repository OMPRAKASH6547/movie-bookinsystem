"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/utils/format";
import type { Movie } from "@/types";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
      className="w-[160px] sm:w-[180px] md:w-[200px] group"
    >
      <Link href={`/movies/${movie.slug}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted mb-3">
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="accent" className="gap-1">
              <Star className="h-3 w-3 fill-current" />
              {movie.rating.toFixed(1)}
            </Badge>
            <span className="text-[10px] text-white/90 font-medium bg-black/50 px-1.5 py-0.5 rounded">
              {formatDuration(movie.duration)}
            </span>
          </div>
        </div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {movie.genres.slice(0, 2).join(" · ")}
        </p>
      </Link>
    </motion.article>
  );
}
