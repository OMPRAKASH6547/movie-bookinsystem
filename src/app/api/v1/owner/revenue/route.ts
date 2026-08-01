import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const data = await multiTheaterService.revenueDashboard(req.user, {
      preset: url.searchParams.get("preset") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      theatreId: url.searchParams.get("theatreId") || undefined,
    });
    return successResponse(data);
  },
  {
    permissionsAny: [
      PERMISSIONS.VIEW_THEATRE_ANALYTICS,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
      PERMISSIONS.VIEW_REPORTS,
    ],
  }
);
