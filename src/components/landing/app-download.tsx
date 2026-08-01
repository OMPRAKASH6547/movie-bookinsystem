"use client";

import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";

export function AppDownload() {
  return (
    <section id="app" className="relative z-10 py-12 md:py-20">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-secondary text-secondary-foreground px-6 py-12 md:px-14 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative max-w-lg">
            <h2 className="font-display text-3xl md:text-5xl tracking-tight mb-3">
              Take {APP_NAME} with you
            </h2>
            <p className="text-secondary-foreground/70 mb-6">
              Scan QR tickets at the gate, get show reminders, and lock seats on the go.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" size="lg">
                App Store
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Google Play
              </Button>
            </div>
          </div>
          <div className="relative flex h-40 w-40 items-center justify-center rounded-3xl bg-primary/20 border border-white/10">
            <Smartphone className="h-20 w-20 text-accent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
