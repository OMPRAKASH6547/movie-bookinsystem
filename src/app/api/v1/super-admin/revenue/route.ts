import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const data = await multiTheaterService.platformRevenue(
      url.searchParams.get("preset") || undefined,
      url.searchParams.get("from") || undefined,
      url.searchParams.get("to") || undefined
    );
    return successResponse(data);
  },
  { roles: [ROLES.SUPER_ADMIN] }
);
