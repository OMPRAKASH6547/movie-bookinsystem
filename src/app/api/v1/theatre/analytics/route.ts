import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    try {
      const data = await multiTheaterService.revenueDashboard(req.user, {
        preset: url.searchParams.get("preset") || "month",
        theatreId: url.searchParams.get("theatreId") || undefined,
        from: url.searchParams.get("from") || undefined,
        to: url.searchParams.get("to") || undefined,
      });
      return successResponse({
        totalRevenue: data.metrics.totalRevenue,
        totalBookings: data.metrics.totalBookings,
        avgTicket: data.metrics.averageTicketPrice,
        activeShows: data.metrics.availableSeats,
        occupancyRate: data.metrics.occupancyPercent,
        todayRevenue: data.metrics.totalRevenue,
        weekly: data.charts.revenueTrend.slice(-7).map((d) => ({
          day: d.date.slice(5),
          bookings: d.tickets,
          revenue: d.revenue,
        })),
        ...data,
      });
    } catch {
      return successResponse({
        totalRevenue: 0,
        totalBookings: 0,
        avgTicket: 0,
        activeShows: 0,
        occupancyRate: 0,
        todayRevenue: 0,
        weekly: [],
        metrics: {},
        charts: { revenueTrend: [], movieWise: [], theatreWise: [] },
      });
    }
  },
  {
    permissionsAny: [PERMISSIONS.VIEW_THEATRE_ANALYTICS, PERMISSIONS.VIEW_OWNER_DASHBOARD],
  }
);
