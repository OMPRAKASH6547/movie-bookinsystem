import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const items = await multiTheaterService.listMovies(req.user);
    return successResponse(items);
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_MOVIES, PERMISSIONS.MANAGE_SHOWS, PERMISSIONS.POS_BOOK],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.title || !body.duration) return errorResponse("title and duration required", 422);
      const movie = await multiTheaterService.createMovie(req.user, body);
      return successResponse(movie, "Movie added", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_MOVIES }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const movie = await multiTheaterService.updateMovie(req.user, body.id, body);
      return successResponse(movie, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_MOVIES }
);
