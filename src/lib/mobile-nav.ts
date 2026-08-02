import type { AuthUser } from "@/types";
import { ROLES, type Role } from "@/constants/roles";
import { filterTheatreNav, type TheatreNavKey } from "@/lib/theatre/nav";

export type MobileNavKey =
  | TheatreNavKey
  | "home"
  | "movies"
  | "bookings"
  | "wallet"
  | "wishlist"
  | "profile"
  | "notifications"
  | "help"
  | "login"
  | "dashboard"
  | "admin_movies"
  | "admin_theatres"
  | "admin_bookings"
  | "admin_users"
  | "admin_coupons"
  | "admin_banners"
  | "admin_analytics"
  | "admin_audit"
  | "admin_settings"
  | "owners"
  | "sa_theatres"
  | "sa_revenue"
  | "tenants"
  | "plans"
  | "commission"
  | "flags"
  | "support"
  | "monitoring"
  | "more"
  | "logout";

export interface MobileNavItem {
  key: MobileNavKey;
  label: string;
  href?: string;
  action?: "logout" | "more";
  exact?: boolean;
}

export interface MobileNavBundle {
  /** Sticky bottom tabs (includes More + Logout when needed) */
  tabs: MobileNavItem[];
  /** Full role menu — same modules as desktop sidebar */
  menu: MobileNavItem[];
}

const ADMIN_MENU: MobileNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", exact: true },
  { key: "admin_movies", label: "Movies", href: "/admin/movies" },
  { key: "admin_theatres", label: "Theatres", href: "/admin/theatres" },
  { key: "admin_bookings", label: "Bookings", href: "/admin/bookings" },
  { key: "admin_users", label: "Users", href: "/admin/users" },
  { key: "admin_coupons", label: "Coupons", href: "/admin/coupons" },
  { key: "admin_banners", label: "Banners", href: "/admin/banners" },
  { key: "admin_analytics", label: "Analytics", href: "/admin/analytics" },
  { key: "admin_audit", label: "Audit logs", href: "/admin/audit" },
  { key: "admin_settings", label: "Settings", href: "/admin/settings" },
];

const SUPER_ADMIN_MENU: MobileNavItem[] = [
  { key: "dashboard", label: "Platform", href: "/super-admin", exact: true },
  { key: "owners", label: "Owners", href: "/super-admin/owners" },
  { key: "sa_theatres", label: "Theatres", href: "/super-admin/theatres" },
  { key: "sa_revenue", label: "Revenue", href: "/super-admin/revenue" },
  { key: "tenants", label: "Tenants", href: "/super-admin/tenants" },
  { key: "plans", label: "Plans", href: "/super-admin/plans" },
  { key: "commission", label: "Commission", href: "/super-admin/commission" },
  { key: "flags", label: "Flags", href: "/super-admin/flags" },
  { key: "support", label: "Support", href: "/super-admin/support" },
  { key: "monitoring", label: "Monitoring", href: "/super-admin/monitoring" },
];

const CUSTOMER_MENU: MobileNavItem[] = [
  { key: "dashboard", label: "Overview", href: "/dashboard", exact: true },
  { key: "bookings", label: "My bookings", href: "/bookings" },
  { key: "wishlist", label: "Wishlist", href: "/wishlist" },
  { key: "wallet", label: "Wallet", href: "/wallet" },
  { key: "profile", label: "Profile", href: "/profile" },
  { key: "notifications", label: "Notifications", href: "/notifications" },
  { key: "help", label: "Help", href: "/#faq" },
  { key: "movies", label: "Movies", href: "/movies" },
  { key: "home", label: "Home", href: "/", exact: true },
];

const GUEST_MENU: MobileNavItem[] = [
  { key: "home", label: "Home", href: "/", exact: true },
  { key: "movies", label: "Movies", href: "/movies" },
  { key: "login", label: "Sign in", href: "/login" },
];

/** Prefer these keys as bottom tabs when available */
const THEATRE_TAB_PRIORITY: TheatreNavKey[] = [
  "overview",
  "pos",
  "verify",
  "counter_sales",
  "collection",
  "shows",
  "revenue",
  "finance",
  "customers",
  "reports",
];

function withLogout(items: MobileNavItem[]): MobileNavItem[] {
  if (items.some((i) => i.action === "logout")) return items;
  return [...items, { key: "logout", label: "Logout", action: "logout" }];
}

function buildTabs(menu: MobileNavItem[], preferredKeys: MobileNavKey[], maxPrimary = 3): MobileNavItem[] {
  const primary: MobileNavItem[] = [];
  for (const key of preferredKeys) {
    const hit = menu.find((m) => m.key === key);
    if (hit && !hit.action) primary.push(hit);
    if (primary.length >= maxPrimary) break;
  }
  // Fill from menu if still short
  for (const item of menu) {
    if (primary.length >= maxPrimary) break;
    if (item.action) continue;
    if (!primary.some((p) => p.key === item.key)) primary.push(item);
  }

  const overflow = menu.filter(
    (m) => !m.action && !primary.some((p) => p.key === m.key)
  );
  const tabs = [...primary];
  if (overflow.length > 0 || menu.length > maxPrimary) {
    tabs.push({ key: "more", label: "More", action: "more" });
  }
  tabs.push({ key: "logout", label: "Logout", action: "logout" });
  return tabs;
}

function theatreMenu(user: AuthUser): MobileNavItem[] {
  return filterTheatreNav(user.permissions, user.role as Role).map((item) => ({
    key: item.key,
    label: item.label,
    href: item.href,
    exact: item.exact,
  }));
}

/** Full role menus + compact bottom tabs for mobile. */
export function getMobileNavBundle(user: AuthUser | null): MobileNavBundle {
  if (!user) {
    return { tabs: GUEST_MENU, menu: GUEST_MENU };
  }

  const role = user.role as Role;

  if (role === ROLES.SUPER_ADMIN) {
    const menu = withLogout(SUPER_ADMIN_MENU);
    return {
      menu,
      tabs: buildTabs(SUPER_ADMIN_MENU, [
        "dashboard",
        "owners",
        "sa_theatres",
        "sa_revenue",
      ]),
    };
  }

  if (role === ROLES.ADMIN) {
    return {
      menu: withLogout(ADMIN_MENU),
      tabs: buildTabs(ADMIN_MENU, [
        "dashboard",
        "admin_movies",
        "admin_bookings",
        "admin_users",
      ]),
    };
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
    const menu = theatreMenu(user);
    return {
      menu: withLogout(menu),
      tabs: buildTabs(menu, THEATRE_TAB_PRIORITY),
    };
  }

  // Customer / guest accounts
  return {
    menu: withLogout(CUSTOMER_MENU),
    tabs: buildTabs(CUSTOMER_MENU, ["home", "movies", "bookings", "wallet", "profile"]),
  };
}

/** @deprecated use getMobileNavBundle — kept for any legacy imports */
export function getMobileNavItems(user: AuthUser | null): MobileNavItem[] {
  return getMobileNavBundle(user).tabs;
}

export function isMobileNavItemActive(item: MobileNavItem, pathname: string): boolean {
  if (item.action || !item.href) return false;
  if (item.exact) return pathname === item.href;
  if (item.href === "/") return pathname === "/";
  if (item.href.startsWith("/#")) return false;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
