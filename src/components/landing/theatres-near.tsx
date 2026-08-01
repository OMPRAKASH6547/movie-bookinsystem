"use client";

import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";

const THEATRES = [
  { name: "PVR ICON", area: "Andheri West", city: "Mumbai", rating: 4.6, screens: 8 },
  { name: "INOX Leisure", area: "Phoenix Mall", city: "Bengaluru", rating: 4.5, screens: 6 },
  { name: "Cinepolis", area: "Select Citywalk", city: "Delhi", rating: 4.4, screens: 7 },
  { name: "Miraj Cinemas", area: "Banjara Hills", city: "Hyderabad", rating: 4.3, screens: 5 },
];

export function TheatresNearYou() {
  return (
    <section id="theatres" className="relative z-10 py-12 md:py-16">
      <div className="container-page">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Theatres near you</h2>
        <p className="text-muted-foreground mb-8">Premium screens with live seat maps</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEATRES.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold">{t.name}</h3>
                <span className="flex items-center gap-1 text-xs text-accent font-semibold">
                  <Star className="h-3 w-3 fill-current" />
                  {t.rating}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {t.area}, {t.city}
              </p>
              <p className="text-xs text-muted-foreground">{t.screens} screens · Dolby / IMAX</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
