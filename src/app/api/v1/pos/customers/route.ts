import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Booking } from "@/models/Booking";
import { resolveOwnerId } from "@/lib/theatre/isolation";
import { posService } from "@/services/pos.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    await connectDB();
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return errorResponse("Search query must be at least 2 characters", 422);
    }

    const ownerId = resolveOwnerId(req.user);
    const users = await User.find({
      role: { $in: ["customer", "guest"] },
      $or: [
        { phone: new RegExp(q.replace(/\D/g, ""), "i") },
        { email: new RegExp(q, "i") },
        { name: new RegExp(q, "i") },
      ],
    })
      .select("name email phone rewardPoints")
      .limit(20)
      .lean();

    // Also match customers who booked under this owner
    const phoneBookings = await Booking.find({
      ownerId,
      $or: [
        { customerPhone: new RegExp(q.replace(/\D/g, "")) },
        { customerName: new RegExp(q, "i") },
        { customerEmail: new RegExp(q, "i") },
      ],
    })
      .select("customerName customerPhone customerEmail userId finalAmount createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    await posService.logActivity(req.user, "CUSTOMER_SEARCH", "Customer", undefined, {
      q,
    });

    return successResponse({
      users,
      recentBookings: phoneBookings,
    });
  },
  { permission: PERMISSIONS.SEARCH_CUSTOMERS }
);
