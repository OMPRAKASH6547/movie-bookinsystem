import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { ownerDashboardService } from "@/services/owner-dashboard.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const data = await ownerDashboardService.todaySummary(
      req.user,
      url.searchParams.get("theatreId") || undefined
    );
    return successResponse(data);
  },
  { permission: PERMISSIONS.VIEW_OWNER_DASHBOARD }
);
