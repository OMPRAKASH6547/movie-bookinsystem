import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { posService } from "@/services/pos.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const rows = await posService.staffPerformance(req.user, {
      theatreId: url.searchParams.get("theatreId") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      role: url.searchParams.get("role") || undefined,
      staffId: url.searchParams.get("staffId") || undefined,
    });
    return successResponse(rows);
  },
  { permission: PERMISSIONS.VIEW_STAFF_PERFORMANCE }
);
