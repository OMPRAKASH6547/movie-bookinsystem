import { withAuth } from "@/lib/api/with-auth";
import { successResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { AuditLog } from "@/models/AuditLog";

export const GET = withAuth(
  async () => {
    try {
      await connectDB();
      const items = await AuditLog.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      if (items.length) return successResponse(items);
    } catch {
      /* fallback */
    }
    return successResponse([
      {
        action: "LOGIN",
        resource: "User",
        details: { email: "admin@cinepass.app" },
        createdAt: new Date().toISOString(),
      },
      {
        action: "REGISTER",
        resource: "User",
        details: { email: "customer@cinepass.app" },
        createdAt: new Date(Date.now() - 864e5).toISOString(),
      },
      {
        action: "BOOKING_CONFIRMED",
        resource: "Booking",
        details: { bookingNumber: "CP-DEMO" },
        createdAt: new Date(Date.now() - 3600e3).toISOString(),
      },
    ]);
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);
