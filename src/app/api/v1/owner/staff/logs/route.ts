import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { ownerDashboardService } from "@/services/owner-dashboard.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const logs = await ownerDashboardService.activityLogs(req.user, {
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      theatreId: url.searchParams.get("theatreId") || undefined,
      action: url.searchParams.get("action") || undefined,
      limit: Number(url.searchParams.get("limit") || 200),
    });
    return successResponse(logs);
  },
  {
    permissionsAny: [PERMISSIONS.VIEW_STAFF_ACTIVITY, PERMISSIONS.VIEW_AUDIT_LOGS],
  }
);
