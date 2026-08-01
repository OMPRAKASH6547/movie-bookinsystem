import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json().catch(() => ({}));
      if (body.action === "logout") {
        await posService.logActivity(req.user, "LOGOUT", "Session");
        return successResponse(await posService.logoutSession(req.user), "Logged out");
      }
      const session = await posService.ensureSession(req.user, {
        theatreId: body.theatreId,
        counterId: body.counterId,
        ip: req.headers.get("x-forwarded-for") || undefined,
        ua: req.headers.get("user-agent") || undefined,
      });
      await posService.logActivity(req.user, "LOGIN", "Session", session._id.toString(), {
        counterId: body.counterId,
      });
      return successResponse(session, "Session active");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  {
    permissionsAny: [
      PERMISSIONS.POS_BOOK,
      PERMISSIONS.POS_CANCEL,
      PERMISSIONS.POS_REPRINT,
      PERMISSIONS.VERIFY_TICKETS,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
    ],
  }
);
