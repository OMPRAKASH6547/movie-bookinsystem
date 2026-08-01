import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.code) return errorResponse("code required (QR/barcode/booking number)", 422);
      const result = await posService.verifyTicket(req.user, String(body.code).trim(), {
        theatreId: body.theatreId,
        exit: Boolean(body.exit),
        deviceInfo: body.deviceInfo || req.headers.get("user-agent") || undefined,
      });
      return successResponse(result);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.VERIFY_TICKETS }
);
