import { z } from "zod";

export const lockSeatsSchema = z.object({
  showId: z.string().min(1),
  seatIds: z.array(z.string()).min(1).max(10),
});

export const createBookingSchema = z.object({
  showId: z.string().min(1),
  seatIds: z.array(z.string()).min(1).max(10),
  couponCode: z.string().optional(),
  paymentMethod: z.enum([
    "stripe",
    "razorpay",
    "payu",
    "paypal",
    "wallet",
    "upi",
    "card",
    "net_banking",
  ]),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  amount: z.number().positive(),
});
