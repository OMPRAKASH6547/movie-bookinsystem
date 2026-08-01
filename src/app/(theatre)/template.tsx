"use client";

import { motion } from "framer-motion";

/** Soft fade between theatre routes to avoid abrupt content swaps */
export default function TheatreTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}