import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const theatreId = new URL(req.url).searchParams.get("theatreId") || undefined;
    const items = await multiTheaterService.listShows(req.user, theatreId);
    return successResponse(items);
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_SHOWS, PERMISSIONS.POS_BOOK, PERMISSIONS.VIEW_OWNER_DASHBOARD],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.movieId || !body.theatreId || !body.screenId || !body.date || !body.times?.length) {
        return errorResponse("movieId, theatreId, screenId, date, times required", 422);
      }
      if (body.basePrice == null) return errorResponse("basePrice required", 422);
      const shows = await multiTheaterService.createShows(req.user, body);
      return successResponse(shows, "Shows created", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_SHOWS }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const show = await multiTheaterService.updateShow(req.user, body.id, body);
      return successResponse(show, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_SHOWS }
);
