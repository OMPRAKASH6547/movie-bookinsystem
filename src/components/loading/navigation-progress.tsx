"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/utils/cn";

/**
 * Top progress bar + soft full-page veil during App Router navigations.
 * Completes when the new pathname is committed and a short settle delay elapses.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [veil, setVeil] = useState(false);
  const [, startTransition] = useTransition();
  const prev = useRef(`${pathname}?${searchParams}`);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const key = `${pathname}?${searchParams}`;
    if (prev.current === key) return;
    prev.current = key;

    // Complete previous navigation
    setProgress(100);
    setVeil(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 280);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (anchor.target === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
      } catch {
        return;
      }

      startTransition(() => {
        setVisible(true);
        setVeil(true);
        setProgress(12);
      });

      let p = 12;
      const tick = window.setInterval(() => {
        p = Math.min(p + Math.random() * 14, 88);
        setProgress(p);
        if (p >= 88) window.clearInterval(tick);
      }, 200);

      window.setTimeout(() => window.clearInterval(tick), 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startTransition]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Page loading"
      >
        <div
          className="h-full bg-accent shadow-[0_0_12px_var(--accent)] transition-[width] duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[90] bg-background/40 backdrop-blur-[1px] transition-opacity duration-200",
          veil && visible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
    </>
  );
}
