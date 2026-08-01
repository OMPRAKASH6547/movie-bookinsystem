"use client";

import { motion } from "framer-motion";
import { OFFERS } from "@/data/movies";
import { Badge } from "@/components/ui/badge";

export function OffersSection() {
  return (
    <section id="offers" className="relative z-10 py-12 md:py-16">
      <div className="container-page">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">Offers for you</h2>
        <p className="text-muted-foreground mb-8">Stack savings on every booking</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OFFERS.map((offer, i) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl p-5 bg-gradient-to-br ${offer.color} text-white shadow-lg`}
            >
              <h3 className="text-xl font-bold mb-1">{offer.title}</h3>
              <p className="text-white/85 text-sm mb-4">{offer.description}</p>
              <Badge className="bg-black/25 text-white border-0 font-mono tracking-wider">
                {offer.code}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
