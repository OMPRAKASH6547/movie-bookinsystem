import type { Role, Permission } from "@/constants/roles";
import type {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  MOVIE_STATUS,
  SEAT_TYPES,
} from "@/constants";

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];
export type MovieStatus = (typeof MOVIE_STATUS)[keyof typeof MOVIE_STATUS];
export type SeatType = (typeof SEAT_TYPES)[keyof typeof SEAT_TYPES];

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  permissions: Permission[];
  sessionId: string;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isEmailVerified: boolean;
  permissions: Permission[];
}

export interface Movie {
  _id: string;
  title: string;
  slug: string;
  description: string;
  poster: string;
  backdrop: string;
  trailerUrl?: string;
  genres: string[];
  languages: string[];
  duration: number;
  rating: number;
  ratingCount: number;
  certification: string;
  releaseDate: string;
  status: MovieStatus;
  cast: CastMember[];
  crew: CrewMember[];
  isFeatured: boolean;
  isTrending: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CastMember {
  name: string;
  role: string;
  image?: string;
}

export interface CrewMember {
  name: string;
  role: string;
  image?: string;
}

export interface Theatre {
  _id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: { type: "Point"; coordinates: [number, number] };
  amenities: string[];
  screens: string[];
  ownerId: string;
  rating: number;
  images: string[];
  isActive: boolean;
}

export interface Screen {
  _id: string;
  theatreId: string;
  name: string;
  capacity: number;
  screenType: "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
  seatLayout: SeatLayout;
}

export interface SeatLayout {
  rows: number;
  columns: number;
  seats: Seat[];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  type: SeatType;
  price: number;
  isAvailable: boolean;
  isAisle?: boolean;
}

export interface Show {
  _id: string;
  movieId: string | Movie;
  theatreId: string | Theatre;
  screenId: string | Screen;
  date: string;
  startTime: string;
  endTime: string;
  language: string;
  format: string;
  basePrice: number;
  pricing: PricingTier[];
  availableSeats: number;
  totalSeats: number;
  isActive: boolean;
}

export interface PricingTier {
  seatType: SeatType;
  price: number;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  userId: string;
  showId: string | Show;
  movieId: string | Movie;
  theatreId: string | Theatre;
  seats: BookedSeat[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  couponCode?: string;
  status: BookingStatus;
  paymentId?: string;
  qrCode?: string;
  pdfUrl?: string;
  lockedUntil?: string;
  cancelledAt?: string;
  refundAmount?: number;
  createdAt: string;
}

export interface BookedSeat {
  seatId: string;
  row: string;
  number: number;
  type: SeatType;
  price: number;
}

export interface Payment {
  _id: string;
  bookingId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  refundId?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Review {
  _id: string;
  movieId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Wallet {
  _id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "offer" | "system" | "chat";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalMovies: number;
  totalTheatres: number;
  todayBookings: number;
  todayRevenue: number;
  occupancyRate: number;
}
