export * from "./roles";

export const APP_NAME = "CinePass";
export const APP_TAGLINE = "Your seat. Your story. Booked in seconds.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  OTP_EXPIRY_MINUTES: 10,
  SEAT_LOCK_SECONDS: 600,
  MAX_DEVICES: 5,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  EXPIRED: "expired",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_METHODS = {
  STRIPE: "stripe",
  RAZORPAY: "razorpay",
  PAYU: "payu",
  PAYPAL: "paypal",
  WALLET: "wallet",
  UPI: "upi",
  CARD: "card",
  NET_BANKING: "net_banking",
} as const;

export const MOVIE_STATUS = {
  UPCOMING: "upcoming",
  NOW_SHOWING: "now_showing",
  ARCHIVED: "archived",
} as const;

export const CITIES = [
  { id: "mumbai", name: "Mumbai", image: "/images/cities/mumbai.jpg" },
  { id: "delhi", name: "Delhi-NCR", image: "/images/cities/delhi.jpg" },
  { id: "bangalore", name: "Bengaluru", image: "/images/cities/bangalore.jpg" },
  { id: "hyderabad", name: "Hyderabad", image: "/images/cities/hyderabad.jpg" },
  { id: "chennai", name: "Chennai", image: "/images/cities/chennai.jpg" },
  { id: "pune", name: "Pune", image: "/images/cities/pune.jpg" },
  { id: "kolkata", name: "Kolkata", image: "/images/cities/kolkata.jpg" },
  { id: "ahmedabad", name: "Ahmedabad", image: "/images/cities/ahmedabad.jpg" },
] as const;

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
] as const;

export const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Bengali",
  "Marathi",
] as const;

export const SEAT_TYPES = {
  REGULAR: "regular",
  PREMIUM: "premium",
  RECLINER: "recliner",
  VIP: "vip",
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },
  API: { windowMs: 60 * 1000, max: 100 },
  BOOKING: { windowMs: 60 * 1000, max: 10 },
  OTP: { windowMs: 60 * 1000, max: 3 },
} as const;
