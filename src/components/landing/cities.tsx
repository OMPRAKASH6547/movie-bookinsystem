"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CITIES } from "@/constants";

export function PopularCities() {
  return (
    <section id="cities" className="relative z-10 py-12 md:py-16">
      <div className="container-page">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Popular cities</h2>
        <p className="text-muted-foreground mb-8">Find showtimes near you</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {CITIES.map((city, i) => (
            <motion.button
              key={city.id}
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="relative h-28 md:h-36 rounded-xl overflow-hidden group text-left border border-border bg-secondary"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary to-secondary" />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <MapPin className="h-4 w-4 text-accent mb-1" />
                <span className="text-white font-semibold text-sm md:text-base">{city.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
