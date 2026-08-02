"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Clapperboard,
  Ticket,
  Wallet,
  User,
  LogIn,
  LayoutDashboard,
  MonitorSmartphone,
  ScanLine,
  UserRoundSearch,
  CalendarClock,
  BarChart3,
  IndianRupee,
  FileSpreadsheet,
  Film,
  Users,
  Building2,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api/client";
import {
  getMobileNavItems,
  isMobileNavItemActive,
  type MobileNavKey,
} from "@/lib/mobile-nav";
import { cn } from "@/utils/cn";

const ICONS: Record<MobileNavKey, LucideIcon> = {
  home: Home,
  movies: Clapperboard,
  bookings: Ticket,
  wallet: Wallet,
  profile: User,
  login: LogIn,
  dashboard: LayoutDashboard,
  pos: MonitorSmartphone,
  verify: ScanLine,
  customers: UserRoundSearch,
  shows: CalendarClock,
  revenue: BarChart3,
  finance: IndianRupee,
  reports: FileSpreadsheet,
  admin_movies: Film,
  admin_bookings: Ticket,
  admin_users: Users,
  owners: UserRoundSearch,
  theatres: Building2,
  logout: LogOut,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Avoid role flicker before zustand persist rehydrates
  if (!hydrated) return null;

  const items = getMobileNavItems(user);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    router.push("/");
  };

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile shortcuts"
    >
      <ul className="grid h-[3.75rem] grid-flow-col auto-cols-fr items-stretch px-1">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          const active = isMobileNavItemActive(item, pathname);
          const className = cn(
            "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors",
            active ? "text-primary" : "text-foreground/80 hover:text-primary",
            item.action === "logout" && "text-destructive hover:text-destructive"
          );

          if (item.action === "logout") {
            return (
              <li key={item.key} className="min-w-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className={cn(className, "w-full")}
                  aria-label="Log out"
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate max-w-full">{item.label}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href || "/"}
                className={className}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
