import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { listDemoTickets } from "@/lib/booking/demo-store";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const status = searchParams.get("status") || undefined;

    try {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      const [items, total] = await Promise.all([
        Booking.find(filter)
          .populate("movieId", "title poster")
          .populate("theatreId", "name city")
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Booking.countDocuments(filter),
      ]);

      // Merge recent demo tickets for visibility in admin
      const demo = await listDemoTickets(req.user.sub).catch(() => []);
      const merged = [
        ...items,
        ...demo.map((d) => ({
          ...d,
          movieId: { title: d.movieTitle },
          theatreId: { name: d.theatreName },
          userId: { name: d.userName, email: d.userEmail },
          source: "demo",
        })),
      ];

      return successResponse(merged, "OK", 200, paginate(page, limit, total + demo.length));
    } catch {
      return successResponse([], "OK", 200, paginate(1, 0, 0));
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.THEATRE_OWNER, ROLES.MANAGER] }
);
