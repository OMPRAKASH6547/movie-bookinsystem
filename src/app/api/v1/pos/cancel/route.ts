import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";
import { canAccess } from "@/lib/auth/rbac";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.bookingId) return errorResponse("bookingId required", 422);

      const wantsRefund = body.refund !== false;
      if (wantsRefund && !canAccess(req.user, PERMISSIONS.POS_REFUND) && !canAccess(req.user, PERMISSIONS.POS_CANCEL)) {
        // cancel alone is enough for counter; refund amount still recorded
      }

      const result = await posService.cancelBooking(req.user, body.bookingId, {
        seatIds: body.seatIds,
        reason: body.reason,
        refund: wantsRefund,
      });

      await posService.logActivity(
        req.user,
        wantsRefund ? "REFUND" : "TICKET_CANCEL",
        "Booking",
        body.bookingId,
        { refundAmount: result.refundAmount }
      );

      return successResponse(result, "Cancelled");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permissionsAny: [PERMISSIONS.POS_CANCEL, PERMISSIONS.POS_REFUND] }
);
