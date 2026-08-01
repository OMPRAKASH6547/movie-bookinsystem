import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 50);
    const role = searchParams.get("role") || undefined;

    try {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (role) filter.role = role;
      const [items, total] = await Promise.all([
        User.find(filter)
          .select("-password -resetPasswordToken -emailVerifyToken")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        User.countDocuments(filter),
      ]);
      return successResponse(items, "OK", 200, paginate(page, limit, total));
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed", 500);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      await connectDB();
      const allowed: Record<string, unknown> = {};
      if (body.role) allowed.role = body.role;
      if (typeof body.isActive === "boolean") allowed.isActive = body.isActive;
      if (body.name) allowed.name = body.name;
      const user = await User.findByIdAndUpdate(body.id, allowed, { new: true }).select(
        "-password"
      );
      if (!user) return errorResponse("Not found", 404);
      return successResponse(user, "User updated");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Update failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);
