import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { bookingService } from "@/services/booking.service";
import { lockSeatsSchema } from "@/lib/validators/booking";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const parsed = lockSeatsSchema.safeParse(body);
      if (!parsed.success) return errorResponse("Validation failed", 422);

      const result = await bookingService.lockSeats(
        req.user.sub,
        parsed.data.showId,
        parsed.data.seatIds
      );
      return successResponse(result, "Seats locked");
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Failed to lock seats",
        409
      );
    }
  },
  { permission: PERMISSIONS.BOOK_TICKETS }
);
