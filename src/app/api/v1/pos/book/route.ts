import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.showId || !body.seats?.length || !body.paymentMethod) {
        return errorResponse("showId, seats, paymentMethod required", 422);
      }
      if (body.paymentMethod === "split" && !body.splitPayments?.length) {
        return errorResponse("splitPayments required for split payment", 422);
      }
      const booking = await posService.createPosBooking(req.user, body, {
        ip: req.headers.get("x-forwarded-for") || undefined,
        ua: req.headers.get("user-agent") || undefined,
      });
      await posService.logActivity(
        req.user,
        "PAYMENT_COLLECTION",
        "Booking",
        booking._id?.toString?.() || String(booking._id),
        { method: body.paymentMethod, amount: booking.finalAmount }
      );
      return successResponse(booking, "Booking confirmed", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.POS_BOOK }
);
