import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const url = new URL(req.url);
      const theatreId = url.searchParams.get("theatreId");
      if (!theatreId) return errorResponse("theatreId required", 422);
      const data = await multiTheaterService.theatreAnalytics(
        req.user,
        theatreId,
        url.searchParams.get("preset") || undefined
      );
      return successResponse(data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.VIEW_THEATRE_ANALYTICS }
);
