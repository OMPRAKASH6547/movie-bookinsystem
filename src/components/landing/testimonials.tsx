"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/data/movies";

export function Testimonials() {
  return (
    <section className="relative z-10 py-12 md:py-16">
      <div className="container-page">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Loved by movie fans</h2>
        <p className="text-muted-foreground mb-8">Real bookings. Real applause.</p>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="flex gap-0.5 mb-4 text-accent">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
              <footer className="flex items-center gap-3">
                <Image
                  src={t.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <cite className="not-italic font-semibold text-sm">{t.name}</cite>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
