import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const items = await multiTheaterService.listOwnerTheatres(req.user);
    return successResponse(items);
  },
  {
    permissionsAny: [
      PERMISSIONS.MANAGE_THEATRES,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
      PERMISSIONS.POS_BOOK,
      PERMISSIONS.VIEW_THEATRE_ANALYTICS,
      PERMISSIONS.MANAGE_FINANCE,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_SHOWS,
      PERMISSIONS.MANAGE_SCREENS,
    ],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.name || !body.address || !body.city || !body.state || !body.pincode) {
        return errorResponse("name, address, city, state, pincode required", 422);
      }
      const theatre = await multiTheaterService.createTheatre(req.user, body);
      return successResponse(theatre, "Theatre submitted for approval", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_THEATRES }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const theatre = await multiTheaterService.updateTheatre(req.user, body.id, body);
      return successResponse(theatre, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_THEATRES }
);

export const DELETE = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) return errorResponse("id required", 422);
      await multiTheaterService.deleteTheatre(req.user, id);
      return successResponse({ deleted: true }, "Deleted");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_THEATRES }
);
