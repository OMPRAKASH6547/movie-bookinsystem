import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { cancelDemoTicket } from "@/lib/booking/demo-store";
import { bookingService } from "@/services/booking.service";
import { connectDB } from "@/lib/db/mongodb";

export const POST = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    const demo = await cancelDemoTicket(req.user.sub, id);
    if (demo) {
      return successResponse(
        { booking: demo, refundAmount: demo.refundAmount },
        "Booking cancelled — refund recorded"
      );
    }

    try {
      await connectDB();
      const result = await bookingService.cancelBooking(req.user.sub, id, body.reason);
      return successResponse(result, "Booking cancelled");
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Cancel failed",
        400
      );
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Cancel failed",
      400
    );
  }
});
