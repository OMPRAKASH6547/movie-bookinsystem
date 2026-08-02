"use client";

import { usePathname } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { cn } from "@/utils/cn";

const HIDDEN_PREFIXES = ["/login", "/register"];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  return (
    <>
      <div
        className={cn(
          "min-h-svh",
          !hideNav && "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0"
        )}
      >
        {children}
      </div>
      {!hideNav && <MobileBottomNav />}
    </>
  );
}
