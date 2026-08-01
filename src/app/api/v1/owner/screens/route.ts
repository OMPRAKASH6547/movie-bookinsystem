import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";
import { posService } from "@/services/pos.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const theatreId = new URL(req.url).searchParams.get("theatreId") || undefined;
    const items = await multiTheaterService.listScreens(req.user, theatreId);
    return successResponse(items);
  },
  {
    permissionsAny: [
      PERMISSIONS.MANAGE_SCREENS,
      PERMISSIONS.MANAGE_SEATS,
      PERMISSIONS.MANAGE_SHOWS,
      PERMISSIONS.POS_BOOK,
    ],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.theatreId || !body.name) return errorResponse("theatreId and name required", 422);
      const screen = await multiTheaterService.createScreen(req.user, body);
      return successResponse(screen, "Screen created", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_SCREENS }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const screen = await multiTheaterService.updateScreen(req.user, body.id, body);
      if (body.seatUpdates || body.seatLayout) {
        await posService.logActivity(req.user, "SEAT_LAYOUT_UPDATE", "Screen", body.id);
      }
      return successResponse(screen, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_SCREENS, PERMISSIONS.MANAGE_SEATS],
  }
);
