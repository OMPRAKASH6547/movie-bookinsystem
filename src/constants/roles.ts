export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  THEATRE_OWNER: "theatre_owner",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  CUSTOMER: "customer",
  GUEST: "guest",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Platform
  MANAGE_TENANTS: "manage_tenants",
  MANAGE_PLANS: "manage_plans",
  MANAGE_FEATURE_FLAGS: "manage_feature_flags",
  VIEW_PLATFORM_ANALYTICS: "view_platform_analytics",

  // Admin
  MANAGE_USERS: "manage_users",
  MANAGE_MOVIES: "manage_movies",
  MANAGE_GENRES: "manage_genres",
  MANAGE_CITIES: "manage_cities",
  MANAGE_THEATRES: "manage_theatres",
  MANAGE_BOOKINGS: "manage_bookings",
  MANAGE_REFUNDS: "manage_refunds",
  MANAGE_COUPONS: "manage_coupons",
  MANAGE_OFFERS: "manage_offers",
  MANAGE_CMS: "manage_cms",
  MANAGE_BANNERS: "manage_banners",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",

  // Theatre
  MANAGE_SCREENS: "manage_screens",
  MANAGE_SEATS: "manage_seats",
  MANAGE_SHOWS: "manage_shows",
  MANAGE_PRICING: "manage_pricing",
  MANAGE_STAFF: "manage_staff",
  VIEW_THEATRE_ANALYTICS: "view_theatre_analytics",

  // Customer
  BOOK_TICKETS: "book_tickets",
  WRITE_REVIEWS: "write_reviews",
  MANAGE_WISHLIST: "manage_wishlist",
  USE_WALLET: "use_wallet",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_MOVIES,
    PERMISSIONS.MANAGE_GENRES,
    PERMISSIONS.MANAGE_CITIES,
    PERMISSIONS.MANAGE_THEATRES,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.MANAGE_REFUNDS,
    PERMISSIONS.MANAGE_COUPONS,
    PERMISSIONS.MANAGE_OFFERS,
    PERMISSIONS.MANAGE_CMS,
    PERMISSIONS.MANAGE_BANNERS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  [ROLES.THEATRE_OWNER]: [
    PERMISSIONS.MANAGE_SCREENS,
    PERMISSIONS.MANAGE_SEATS,
    PERMISSIONS.MANAGE_SHOWS,
    PERMISSIONS.MANAGE_PRICING,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.MANAGE_OFFERS,
    PERMISSIONS.VIEW_THEATRE_ANALYTICS,
    PERMISSIONS.MANAGE_BOOKINGS,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.MANAGE_SHOWS,
    PERMISSIONS.MANAGE_PRICING,
    PERMISSIONS.VIEW_THEATRE_ANALYTICS,
    PERMISSIONS.MANAGE_BOOKINGS,
  ],
  [ROLES.EMPLOYEE]: [PERMISSIONS.MANAGE_BOOKINGS],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.BOOK_TICKETS,
    PERMISSIONS.WRITE_REVIEWS,
    PERMISSIONS.MANAGE_WISHLIST,
    PERMISSIONS.USE_WALLET,
  ],
  [ROLES.GUEST]: [PERMISSIONS.BOOK_TICKETS],
};
