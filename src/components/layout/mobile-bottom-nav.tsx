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
  Menu,
  X,
  Armchair,
  Tag,
  Receipt,
  Landmark,
  Activity,
  Trophy,
  Heart,
  Bell,
  HelpCircle,
  Settings,
  ScrollText,
  Image as ImageIcon,
  Building,
  CreditCard,
  Flag,
  LifeBuoy,
  Percent,
  UserPlus,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api/client";
import {
  getMobileNavBundle,
  isMobileNavItemActive,
  type MobileNavItem,
  type MobileNavKey,
} from "@/lib/mobile-nav";
import { cn } from "@/utils/cn";

const ICONS: Record<MobileNavKey, LucideIcon> = {
  home: Home,
  movies: Clapperboard,
  bookings: Ticket,
  wallet: Wallet,
  wishlist: Heart,
  profile: User,
  notifications: Bell,
  help: HelpCircle,
  login: LogIn,
  dashboard: LayoutDashboard,
  overview: LayoutDashboard,
  theatres: Building2,
  screens: Clapperboard,
  seats: Armchair,
  shows: CalendarClock,
  pricing: IndianRupee,
  pos: MonitorSmartphone,
  verify: ScanLine,
  customers: UserRoundSearch,
  staff: Users,
  performance: Trophy,
  activity: Activity,
  revenue: BarChart3,
  reports: FileSpreadsheet,
  finance: Wallet,
  promotions: Tag,
  counter_sales: Receipt,
  collection: Landmark,
  analytics: BarChart3,
  admin_movies: Film,
  admin_theatres: Building2,
  admin_bookings: Ticket,
  admin_users: Users,
  admin_coupons: Tag,
  admin_banners: ImageIcon,
  admin_analytics: BarChart3,
  admin_audit: ScrollText,
  admin_settings: Settings,
  owners: UserPlus,
  sa_theatres: Clapperboard,
  sa_revenue: LineChart,
  tenants: Building,
  plans: CreditCard,
  commission: Percent,
  flags: Flag,
  support: LifeBuoy,
  monitoring: Activity,
  more: Menu,
  logout: LogOut,
};

function NavButton({
  item,
  active,
  onClick,
  className,
}: {
  item: MobileNavItem;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Icon = ICONS[item.key] || Menu;
  const classes = cn(
    "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors w-full",
    active ? "text-primary" : "text-foreground/80 hover:text-primary",
    item.action === "logout" && "text-destructive hover:text-destructive",
    className
  );

  if (item.action === "logout" || item.action === "more") {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={item.label}>
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
        <span className="truncate max-w-full">{item.label}</span>
      </button>
    );
  }

  return (
    <Link
      href={item.href || "/"}
      className={classes}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      <span className="truncate max-w-full">{item.label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [hydrated, setHydrated] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (!hydrated) return null;

  const { tabs, menu } = getMobileNavBundle(user);
  const menuLinks = menu.filter((m) => m.action !== "logout");

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    logout();
    setMoreOpen(false);
    router.push("/");
  };

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Mobile navigation"
      >
        <ul className="grid h-[3.75rem] grid-flow-col auto-cols-fr items-stretch px-1">
          {tabs.map((item) => {
            const active =
              item.action === "more"
                ? moreOpen
                : isMobileNavItemActive(item, pathname);
            return (
              <li key={item.key} className="min-w-0">
                <NavButton
                  item={item}
                  active={active}
                  onClick={
                    item.action === "logout"
                      ? handleLogout
                      : item.action === "more"
                        ? () => setMoreOpen((v) => !v)
                        : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Full role menu — mirrors desktop sidebar */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border border-border bg-background shadow-2xl flex flex-col"
            style={{ paddingBottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))" }}
            role="dialog"
            aria-label="All menu options"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="font-semibold text-sm">All modules</p>
                <p className="text-xs text-muted-foreground">
                  Same options as desktop sidebar
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-md hover:bg-muted"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 grid grid-cols-3 gap-2">
              {menuLinks.map((item) => {
                const Icon = ICONS[item.key] || Menu;
                const active = isMobileNavItemActive(item, pathname);
                return (
                  <Link
                    key={item.key}
                    href={item.href || "/"}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[11px] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card/60 text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                    <span className="leading-tight line-clamp-2">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Horizontal scroll of full role menu under header (dashboard mobile) */
export function MobileDashMenu({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  if (!items.length) return null;

  return (
    <div className="lg:hidden border-b border-border bg-card/60 overflow-x-auto">
      <div className="flex gap-1 px-2 py-2 min-w-max">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
