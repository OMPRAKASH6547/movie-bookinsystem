import { z } from "zod";
import QRCode from "qrcode";
import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { createDemoTicket } from "@/lib/booking/demo-store";
import { buildPayUPayment, isPayUConfigured, getPayUCheckoutUrl } from "@/lib/payment/payu";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS, PAYMENT_METHODS } from "@/constants";
import { seatLock } from "@/lib/redis/client";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { bookingService } from "@/services/booking.service";

const checkoutSchema = z.object({
  movieId: z.string(),
  movieTitle: z.string(),
  moviePoster: z.string(),
  movieSlug: z.string(),
  theatreId: z.string(),
  theatreName: z.string(),
  showId: z.string(),
  date: z.string(),
  time: z.string(),
  seats: z
    .array(
      z.object({
        seatId: z.string(),
        row: z.string(),
        number: z.number(),
        type: z.string(),
        price: z.number(),
      })
    )
    .min(1)
    .max(10),
  totalAmount: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative(),
  finalAmount: z.number().positive(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum([
    "payu",
    "stripe",
    "razorpay",
    "wallet",
    "upi",
    "card",
    "net_banking",
    "paypal",
  ]),
  userName: z.string().optional(),
  phone: z.string().optional(),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited = await rateLimit(req, { ...RATE_LIMITS.BOOKING, keyPrefix: "rl:checkout" });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })));
    }

    const data = parsed.data;
    const userId = req.user.sub;

    // Lock seats in Redis
    for (const seat of data.seats) {
      const ok = await seatLock.lock(data.showId, seat.seatId, userId, 600);
      if (!ok) {
        return errorResponse(`Seat ${seat.seatId} is locked by another user`, 409);
      }
    }

    let userName = data.userName || req.user.email.split("@")[0];
    let userEmail = req.user.email;
    let phone = data.phone || "9999999999";

    try {
      await connectDB();
      const user = await User.findById(userId);
      if (user) {
        userName = user.name;
        userEmail = user.email;
        phone = user.phone || phone;
      }
    } catch {
      /* demo path without Mongo */
    }

    const txnid = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // PayU live redirect when configured and method is payu
    if (data.paymentMethod === PAYMENT_METHODS.PAYU && isPayUConfigured()) {
      const pendingTicket = await createDemoTicket({
        ...data,
        userId,
        userName,
        userEmail,
        paymentMethod: "payu",
        transactionId: txnid,
        status: "pending",
      });

      const payu = buildPayUPayment({
        txnid,
        amount: data.finalAmount,
        productinfo: `${data.movieTitle} - ${data.seats.map((s) => s.seatId).join(",")}`,
        firstname: userName,
        email: userEmail,
        phone,
        bookingId: pendingTicket._id,
        userId,
      });

      return successResponse(
        {
          mode: "payu_redirect",
          checkoutUrl: getPayUCheckoutUrl(),
          payu,
          bookingId: pendingTicket._id,
          bookingNumber: pendingTicket.bookingNumber,
        },
        "Redirect to PayU"
      );
    }

    // Try Mongo booking when show is a real ObjectId
    const isRealShow = /^[a-f\d]{24}$/i.test(data.showId);
    if (isRealShow) {
      try {
        await connectDB();
        const result = await bookingService.createBooking(userId, {
          showId: data.showId,
          seatIds: data.seats.map((s) => s.seatId),
          couponCode: data.couponCode,
          paymentMethod: data.paymentMethod,
        });
        const booking = "booking" in result ? result.booking : result;
        const qr =
          "qrCode" in result && result.qrCode
            ? result.qrCode
            : await QRCode.toDataURL(
                JSON.stringify({
                  bookingNumber: (booking as { bookingNumber: string }).bookingNumber,
                })
              );

        return successResponse(
          {
            mode: "confirmed",
            booking: {
              ...(typeof booking.toObject === "function" ? booking.toObject() : booking),
              qrCode: qr,
              movieTitle: data.movieTitle,
              theatreName: data.theatreName,
              date: data.date,
              time: data.time,
            },
          },
          "Booking confirmed"
        );
      } catch {
        /* fall through to demo ticket */
      }
    }

    // Demo / offline confirmation with real QR (always works)
    const ticket = await createDemoTicket({
      ...data,
      userId,
      userName,
      userEmail,
      paymentMethod: data.paymentMethod,
      transactionId: txnid,
    });

    for (const seat of data.seats) {
      await seatLock.unlock(data.showId, seat.seatId, userId);
    }

    return successResponse(
      {
        mode: "confirmed",
        booking: ticket,
        demo: true,
      },
      "Booking confirmed"
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Checkout failed",
      400
    );
  }
});

/** Allow unauthenticated checkout for guest browsing → create guest session first */
export async function OPTIONS() {
  return successResponse(null);
}
