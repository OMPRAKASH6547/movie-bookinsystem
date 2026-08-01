import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) =>
    successResponse(await multiTheaterService.listStaff(req.user)),
  { permission: PERMISSIONS.MANAGE_STAFF }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.name || !body.email) return errorResponse("name and email required", 422);
      const staff = await multiTheaterService.createStaff(req.user, {
        ...body,
        role: body.role || "counter_staff",
      });
      return successResponse(staff, "Staff added", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_STAFF }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const staff = await multiTheaterService.updateStaff(req.user, body.id, {
        ...body,
        isActive: body.active ?? body.isActive,
      });
      return successResponse(staff, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_STAFF }
);
