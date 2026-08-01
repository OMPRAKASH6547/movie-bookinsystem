import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { bookingService } from "@/services/booking.service";
import { createBookingSchema } from "@/lib/validators/booking";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS } from "@/constants";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const result = await bookingService.getUserBookings(req.user.sub, page, limit);
    return successResponse(
      result.items,
      "Bookings fetched",
      200,
      paginate(result.page, result.limit, result.total)
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch bookings",
      500
    );
  }
});

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    const limited = await rateLimit(req, { ...RATE_LIMITS.BOOKING, keyPrefix: "rl:booking" });
    if (limited) return limited;

    try {
      const body = await req.json();
      const parsed = createBookingSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse("Validation failed", 422);
      }

      const result = await bookingService.createBooking(req.user.sub, parsed.data);
      return successResponse(result, "Booking created", 201);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Booking failed",
        400
      );
    }
  },
  { permission: PERMISSIONS.BOOK_TICKETS }
);
