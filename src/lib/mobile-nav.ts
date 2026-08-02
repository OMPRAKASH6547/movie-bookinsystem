import type { AuthUser } from "@/types";
import { ROLES, type Role } from "@/constants/roles";
import { defaultTheatreLanding, filterTheatreNav } from "@/lib/theatre/nav";

export type MobileNavKey =
  | "home"
  | "movies"
  | "bookings"
  | "wallet"
  | "profile"
  | "login"
  | "dashboard"
  | "pos"
  | "verify"
  | "customers"
  | "shows"
  | "revenue"
  | "finance"
  | "reports"
  | "admin_movies"
  | "admin_bookings"
  | "admin_users"
  | "owners"
  | "theatres"
  | "logout";

export interface MobileNavItem {
  key: MobileNavKey;
  label: string;
  href?: string;
  action?: "logout";
  /** Exact path match; otherwise prefix match on href */
  exact?: boolean;
}

function theatreShortcuts(user: AuthUser): MobileNavItem[] {
  const allowed = new Set(filterTheatreNav(user.permissions, user.role as Role).map((i) => i.key));
  const home = defaultTheatreLanding(user.permissions, user.role as Role);
  const items: MobileNavItem[] = [
    { key: "home", label: "Home", href: home, exact: home === "/theatre" },
  ];

  if (allowed.has("pos")) {
    items.push({ key: "pos", label: "POS", href: "/theatre/pos" });
  }
  if (allowed.has("verify")) {
    items.push({ key: "verify", label: "Scan", href: "/theatre/verify" });
  }
  if (allowed.has("customers") && items.length < 4) {
    items.push({ key: "customers", label: "Guests", href: "/theatre/customers" });
  }
  if (allowed.has("shows") && items.length < 4) {
    items.push({ key: "shows", label: "Shows", href: "/theatre/shows" });
  }
  if (allowed.has("finance") && items.length < 4) {
    items.push({ key: "finance", label: "Finance", href: "/theatre/finance" });
  }
  if (allowed.has("reports") && items.length < 4) {
    items.push({ key: "reports", label: "Reports", href: "/theatre/reports" });
  }
  if (allowed.has("revenue") && items.length < 4) {
    items.push({ key: "revenue", label: "Revenue", href: "/theatre/revenue" });
  }

  items.push({ key: "logout", label: "Logout", action: "logout" });
  return items.slice(0, 5);
}

/** Frequent destinations for the mobile sticky bottom bar — varies by role. */
export function getMobileNavItems(user: AuthUser | null): MobileNavItem[] {
  if (!user) {
    return [
      { key: "home", label: "Home", href: "/", exact: true },
      { key: "movies", label: "Movies", href: "/movies" },
      { key: "login", label: "Sign in", href: "/login" },
    ];
  }

  const role = user.role as Role;

  if (role === ROLES.SUPER_ADMIN) {
    return [
      { key: "dashboard", label: "Home", href: "/super-admin", exact: true },
      { key: "owners", label: "Owners", href: "/super-admin/owners" },
      { key: "theatres", label: "Theatres", href: "/super-admin/theatres" },
      { key: "revenue", label: "Revenue", href: "/super-admin/revenue" },
      { key: "logout", label: "Logout", action: "logout" },
    ];
  }

  if (role === ROLES.ADMIN) {
    return [
      { key: "dashboard", label: "Home", href: "/admin", exact: true },
      { key: "admin_movies", label: "Movies", href: "/admin/movies" },
      { key: "admin_bookings", label: "Bookings", href: "/admin/bookings" },
      { key: "admin_users", label: "Users", href: "/admin/users" },
      { key: "logout", label: "Logout", action: "logout" },
    ];
  }

  if (
    role === ROLES.THEATRE_OWNER ||
    role === ROLES.MANAGER ||
    role === ROLES.COUNTER_STAFF ||
    role === ROLES.TICKET_CHECKER ||
    role === ROLES.ACCOUNTANT ||
    role === ROLES.MARKETING ||
    role === ROLES.EMPLOYEE
  ) {
    return theatreShortcuts(user);
  }

  // Customer / guest accounts
  return [
    { key: "home", label: "Home", href: "/", exact: true },
    { key: "movies", label: "Movies", href: "/movies" },
    { key: "bookings", label: "Tickets", href: "/bookings" },
    { key: "profile", label: "Profile", href: "/profile" },
    { key: "logout", label: "Logout", action: "logout" },
  ];
}

export function isMobileNavItemActive(item: MobileNavItem, pathname: string): boolean {
  if (item.action || !item.href) return false;
  if (item.exact) return pathname === item.href;
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
