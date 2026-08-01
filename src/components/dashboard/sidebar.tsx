"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket } from "lucide-react";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/constants";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardSidebar({
  items,
  title,
}: {
  items: NavItem[];
  title: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 min-h-svh sticky top-0">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Ticket className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-lg leading-none">{APP_NAME}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
              {title}
            </p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
