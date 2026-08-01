import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { bookingService } from "@/services/booking.service";
import { lockSeatsSchema } from "@/lib/validators/booking";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { seatLock } from "@/lib/redis/client";
import { TOKEN_CONFIG } from "@/constants";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const parsed = lockSeatsSchema.safeParse(body);
      if (!parsed.success) return errorResponse("Validation failed", 422);

      const { showId, seatIds } = parsed.data;
      const userId = req.user.sub;

      // Real Mongo show path
      if (/^[a-f\d]{24}$/i.test(showId)) {
        try {
          const result = await bookingService.lockSeats(userId, showId, seatIds);
          return successResponse(result, "Seats locked");
        } catch (error) {
          return errorResponse(
            error instanceof Error ? error.message : "Failed to lock seats",
            409
          );
        }
      }

      // Demo / offline Redis locks
      const results = await Promise.all(
        seatIds.map((seatId) =>
          seatLock.lock(showId, seatId, userId, TOKEN_CONFIG.SEAT_LOCK_SECONDS)
        )
      );

      if (results.some((r) => !r)) {
        await Promise.all(seatIds.map((id) => seatLock.unlock(showId, id, userId)));
        return errorResponse("One or more seats are locked by another user", 409);
      }

      return successResponse(
        {
          locked: seatIds,
          expiresIn: TOKEN_CONFIG.SEAT_LOCK_SECONDS,
          expiresAt: new Date(Date.now() + TOKEN_CONFIG.SEAT_LOCK_SECONDS * 1000),
          demo: true,
        },
        "Seats locked"
      );
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Failed to lock seats",
        409
      );
    }
  },
  { permission: PERMISSIONS.BOOK_TICKETS }
);
