import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { listDemoTickets } from "@/lib/booking/demo-store";
import { bookingService } from "@/services/booking.service";
import { connectDB } from "@/lib/db/mongodb";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);

    const demoTickets = await listDemoTickets(req.user.sub);

    let mongoItems: unknown[] = [];
    try {
      await connectDB();
      const result = await bookingService.getUserBookings(req.user.sub, page, limit);
      mongoItems = result.items;
    } catch {
      /* ignore */
    }

    const merged = [
      ...demoTickets.map((t) => ({
        ...t,
        movieId: { title: t.movieTitle, poster: t.moviePoster, slug: t.movieSlug },
        theatreId: { name: t.theatreName },
        showId: { date: t.date, startTime: t.time },
        source: "demo",
      })),
      ...mongoItems,
    ];

    return successResponse(
      merged,
      "Bookings fetched",
      200,
      paginate(page, limit, merged.length)
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch bookings",
      500
    );
  }
});
