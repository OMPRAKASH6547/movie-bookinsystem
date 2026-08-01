import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const theatreId = new URL(req.url).searchParams.get("theatreId") || undefined;
    return successResponse(await multiTheaterService.listScreens(req.user, theatreId));
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
      if (!body.name) return errorResponse("name required", 422);
      let theatreId = body.theatreId;
      if (!theatreId) {
        const theatres = await multiTheaterService.listOwnerTheatres(req.user);
        theatreId = theatres[0]?._id?.toString();
      }
      if (!theatreId) return errorResponse("Create a theatre first", 422);
      const screen = await multiTheaterService.createScreen(req.user, { ...body, theatreId });
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
      return successResponse(
        await multiTheaterService.updateScreen(req.user, body.id, body),
        "Updated"
      );
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_SCREENS, PERMISSIONS.MANAGE_SEATS],
  }
);
