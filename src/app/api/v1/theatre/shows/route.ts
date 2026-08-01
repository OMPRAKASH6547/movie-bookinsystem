import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const theatreId = new URL(req.url).searchParams.get("theatreId") || undefined;
    return successResponse(await multiTheaterService.listShows(req.user, theatreId));
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_SHOWS, PERMISSIONS.POS_BOOK, PERMISSIONS.VIEW_OWNER_DASHBOARD],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const times =
        body.times ||
        (body.startTime ? [String(body.startTime).slice(11, 16) || "18:00"] : ["18:00"]);
      const date = body.date || new Date().toISOString().slice(0, 10);
      let theatreId = body.theatreId;
      let screenId = body.screenId;
      if (!theatreId || !screenId) {
        const theatres = await multiTheaterService.listOwnerTheatres(req.user);
        theatreId = theatreId || theatres[0]?._id?.toString();
        const screens = await multiTheaterService.listScreens(req.user, theatreId);
        screenId = screenId || screens[0]?._id?.toString();
      }
      if (!body.movieId || !theatreId || !screenId) {
        return errorResponse("movieId, theatreId, screenId required", 422);
      }
      const shows = await multiTheaterService.createShows(req.user, {
        movieId: body.movieId,
        theatreId,
        screenId,
        date,
        times,
        language: body.language,
        format: body.format,
        basePrice: body.basePrice ?? 220,
        pricing: body.pricing,
        weekendPricing: body.weekendPricing,
        holidayPricing: body.holidayPricing,
        recurringDays: body.recurringDays || 1,
      });
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
      return successResponse(await multiTheaterService.updateShow(req.user, body.id, body), "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_SHOWS }
);
