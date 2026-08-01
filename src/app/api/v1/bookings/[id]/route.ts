import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { bookingService } from "@/services/booking.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const params = await context.params;
    const booking = await bookingService.getBooking(req.user.sub, params.id);
    return successResponse(booking);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Not found", 404);
  }
});

export const DELETE = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const params = await context.params;
    const body = await req.json().catch(() => ({}));
    const result = await bookingService.cancelBooking(req.user.sub, params.id, body.reason);
    return successResponse(result, "Booking cancelled");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Cancel failed", 400);
  }
});
