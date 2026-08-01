import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { getDemoTicket } from "@/lib/booking/demo-store";
import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await context.params;

    const demo = await getDemoTicket(id);
    if (demo) {
      if (demo.userId !== req.user.sub && !["admin", "super_admin"].includes(req.user.role)) {
        return errorResponse("Unauthorized", 403);
      }
      return successResponse(demo);
    }

    try {
      await connectDB();
      const booking = await Booking.findById(id)
        .populate("movieId")
        .populate("theatreId")
        .populate("showId")
        .lean();
      if (!booking) return errorResponse("Ticket not found", 404);
      if (
        booking.userId.toString() !== req.user.sub &&
        !["admin", "super_admin"].includes(req.user.role)
      ) {
        return errorResponse("Unauthorized", 403);
      }
      return successResponse(booking);
    } catch {
      return errorResponse("Ticket not found", 404);
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load ticket",
      500
    );
  }
});
