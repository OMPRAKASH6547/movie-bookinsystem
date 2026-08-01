import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { ownerDashboardService } from "@/services/owner-dashboard.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const rows = await ownerDashboardService.staffTodayTable(req.user, {
      theatreId: url.searchParams.get("theatreId") || undefined,
      counterId: url.searchParams.get("counterId") || undefined,
      staffId: url.searchParams.get("staffId") || undefined,
      date: url.searchParams.get("date") || undefined,
      sort: url.searchParams.get("sort") || undefined,
    });
    return successResponse(rows);
  },
  { permission: PERMISSIONS.VIEW_STAFF_PERFORMANCE }
);
