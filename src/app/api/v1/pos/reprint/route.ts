import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.bookingId) return errorResponse("bookingId required", 422);
      const booking = await posService.reprint(req.user, body.bookingId);
      const width = body.width === 58 ? 58 : 80;
      const thermal = await posService.thermalPayload(body.bookingId, width);
      await posService.logActivity(req.user, "TICKET_REPRINT", "Booking", body.bookingId, {
        width,
      });
      return successResponse({ booking, thermal }, "Reprint ready");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.POS_REPRINT }
);
