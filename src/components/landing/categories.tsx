"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GENRES } from "@/constants";

export function Categories() {
  return (
    <section className="relative z-10 py-8">
      <div className="container-page">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Browse by genre</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre, i) => (
            <motion.div
              key={genre}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                href={`/movies?genre=${encodeURIComponent(genre)}`}
                className="inline-block rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {genre}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
