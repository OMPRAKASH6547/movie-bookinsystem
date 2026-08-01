import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const status = url.searchParams.get("status") || undefined;
    const result = await multiTheaterService.listOwners({ status, page, limit });
    return successResponse(result.items, "OK", 200, paginate(page, limit, result.total));
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.name || !body.email) return errorResponse("name and email required", 422);
      const owner = await multiTheaterService.onboardOwner(body);
      return successResponse(owner, "Owner onboarded", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN], permission: "onboard_owners" }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id || !body.status) return errorResponse("id and status required", 422);
      const owner = await multiTheaterService.updateOwnerStatus(
        body.id,
        body.status,
        body.note
      );
      return successResponse(owner, "Owner updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);
