import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const sessions = await posService.listSessions(req.user, {
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
    });
    return successResponse(sessions);
  },
  {
    permissionsAny: [PERMISSIONS.VIEW_STAFF_ACTIVITY, PERMISSIONS.VIEW_STAFF_PERFORMANCE],
  }
);
