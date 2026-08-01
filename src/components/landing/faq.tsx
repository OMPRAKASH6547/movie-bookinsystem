"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/data/movies";
import { cn } from "@/utils/cn";

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 py-12 md:py-16">
      <div className="container-page max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-2">FAQ</h2>
        <p className="text-muted-foreground mb-8">Answers before the lights go down</p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="border border-border rounded-xl bg-card overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
