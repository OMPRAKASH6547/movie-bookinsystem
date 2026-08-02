import type { Permission } from "@/constants/roles";
import { PERMISSIONS, ROLES, type Role } from "@/constants/roles";

export type TheatreNavKey =
  | "overview"
  | "theatres"
  | "screens"
  | "seats"
  | "movies"
  | "shows"
  | "pricing"
  | "pos"
  | "verify"
  | "staff"
  | "performance"
  | "activity"
  | "revenue"
  | "reports"
  | "finance"
  | "analytics"
  | "customers"
  | "promotions"
  | "counter_sales"
  | "collection";

export interface TheatreNavDef {
  key: TheatreNavKey;
  href: string;
  label: string;
  /** User needs ANY of these permissions */
  permissions: Permission[];
  /** Exact match for overview so /theatre/pos does not highlight overview */
  exact?: boolean;
}

/**
 * Sidebar modules — filtered by effective permissions.
 * Counter staff with only POS perms will only see POS (+ customers if granted).
 */
export const THEATRE_NAV: TheatreNavDef[] = [
  {
    key: "overview",
    href: "/theatre",
    label: "Overview",
    permissions: [PERMISSIONS.VIEW_OWNER_DASHBOARD],
    exact: true,
  },
  {
    key: "theatres",
    href: "/theatre/theatres",
    label: "Theatres",
    permissions: [PERMISSIONS.MANAGE_THEATRES],
  },
  {
    key: "screens",
    href: "/theatre/screens",
    label: "Screens",
    permissions: [PERMISSIONS.MANAGE_SCREENS],
  },
  {
    key: "seats",
    href: "/theatre/seats",
    label: "Seat layout",
    permissions: [PERMISSIONS.MANAGE_SEATS],
  },
  {
    key: "movies",
    href: "/theatre/movies",
    label: "Movies",
    permissions: [PERMISSIONS.MANAGE_MOVIES],
  },
  {
    key: "shows",
    href: "/theatre/shows",
    label: "Shows",
    permissions: [PERMISSIONS.MANAGE_SHOWS],
  },
  {
    key: "pricing",
    href: "/theatre/pricing",
    label: "Pricing",
    permissions: [PERMISSIONS.MANAGE_PRICING],
  },
  {
    key: "pos",
    href: "/theatre/pos",
    label: "POS Counter",
    permissions: [PERMISSIONS.POS_BOOK],
  },
  {
    key: "customers",
    href: "/theatre/customers",
    label: "Customers",
    permissions: [PERMISSIONS.SEARCH_CUSTOMERS],
  },
  {
    key: "verify",
    href: "/theatre/verify",
    label: "Ticket check",
    permissions: [PERMISSIONS.VERIFY_TICKETS],
  },
  {
    key: "staff",
    href: "/theatre/staff",
    label: "Staff",
    permissions: [PERMISSIONS.MANAGE_STAFF],
  },
  {
    key: "performance",
    href: "/theatre/performance",
    label: "Performance",
    permissions: [PERMISSIONS.VIEW_STAFF_PERFORMANCE],
  },
  {
    key: "activity",
    href: "/theatre/activity",
    label: "Activity logs",
    permissions: [PERMISSIONS.VIEW_STAFF_ACTIVITY, PERMISSIONS.VIEW_AUDIT_LOGS],
  },
  {
    key: "revenue",
    href: "/theatre/revenue",
    label: "Revenue",
    permissions: [PERMISSIONS.VIEW_THEATRE_ANALYTICS, PERMISSIONS.VIEW_OWNER_DASHBOARD],
  },
  {
    key: "reports",
    href: "/theatre/reports",
    label: "Reports",
    permissions: [PERMISSIONS.VIEW_REPORTS],
  },
  {
    key: "finance",
    href: "/theatre/finance",
    label: "Finance",
    permissions: [PERMISSIONS.MANAGE_FINANCE],
  },
  {
    key: "promotions",
    href: "/theatre/promotions",
    label: "Offers & Coupons",
    permissions: [PERMISSIONS.MANAGE_OFFERS, PERMISSIONS.MANAGE_COUPONS],
  },
  {
    key: "counter_sales",
    href: "/theatre/counter-sales",
    label: "Counter sales",
    permissions: [
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_STAFF_PERFORMANCE,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
    ],
  },
  {
    key: "collection",
    href: "/theatre/collection",
    label: "Collections",
    permissions: [PERMISSIONS.MANAGE_FINANCE, PERMISSIONS.VIEW_REPORTS],
  },
  {
    key: "analytics",
    href: "/theatre/analytics",
    label: "Analytics",
    permissions: [PERMISSIONS.VIEW_THEATRE_ANALYTICS],
  },
];

export function filterTheatreNav(
  permissions: string[] | undefined | null,
  role?: Role
): TheatreNavDef[] {
  // Super admin / owner with full perms see everything via permission list
  const perms = new Set(permissions || []);
  if (role === ROLES.SUPER_ADMIN) return THEATRE_NAV;

  return THEATRE_NAV.filter((item) => item.permissions.some((p) => perms.has(p)));
}

export function canAccessTheatrePath(
  pathname: string,
  permissions: string[] | undefined | null,
  role?: Role
): boolean {
  if (role === ROLES.SUPER_ADMIN) return true;
  const perms = new Set(permissions || []);

  // Find best matching nav item (longest href match)
  const matches = THEATRE_NAV.filter((item) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }).sort((a, b) => b.href.length - a.href.length);

  const item = matches[0];
  if (!item) {
    // Unknown theatre subpath — deny unless owner dashboard
    return perms.has(PERMISSIONS.VIEW_OWNER_DASHBOARD);
  }
  return item.permissions.some((p) => perms.has(p));
}

export function defaultTheatreLanding(
  permissions: string[] | undefined | null,
  role?: Role
): string {
  const items = filterTheatreNav(permissions, role);
  if (items.length === 0) return "/login";
  // Prefer POS for counter-like users
  const pos = items.find((i) => i.key === "pos");
  if (pos && !items.some((i) => i.key === "overview")) return pos.href;
  return items[0].href;
}
