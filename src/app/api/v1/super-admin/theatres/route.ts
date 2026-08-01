import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const result = await multiTheaterService.listAllTheatres({
      status: url.searchParams.get("status") || undefined,
      city: url.searchParams.get("city") || undefined,
      ownerId: url.searchParams.get("ownerId") || undefined,
      page: Number(url.searchParams.get("page") || 1),
      limit: Number(url.searchParams.get("limit") || 20),
    });
    return successResponse(
      result.items,
      "OK",
      200,
      paginate(result.page, result.limit, result.total)
    );
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      if (body.commissionRate != null) {
        const t = await multiTheaterService.setCommission(body.id, Number(body.commissionRate));
        return successResponse(t, "Commission updated");
      }
      if (!body.status) return errorResponse("status required", 422);
      const theatre = await multiTheaterService.setTheatreStatus(
        body.id,
        body.status,
        req.user.sub,
        body.note
      );
      return successResponse(theatre, "Theatre updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);
