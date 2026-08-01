import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { multiTheaterService } from "@/services/multi-theater.service";
import { connectDB } from "@/lib/db/mongodb";
import { UserTheaterMapping } from "@/models/Rbac";
import { resolveOwnerId } from "@/lib/theatre/isolation";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const items = await multiTheaterService.listStaff(req.user);
    return successResponse(items);
  },
  { permission: PERMISSIONS.MANAGE_STAFF }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.name || !body.email || !body.role) {
        return errorResponse("name, email, role required", 422);
      }
      const staff = await multiTheaterService.createStaff(req.user, body);
      if (staff) {
        await connectDB();
        const ownerId = resolveOwnerId(req.user);
        await UserTheaterMapping.findOneAndUpdate(
          { userId: staff._id, ownerId },
          {
            userId: staff._id,
            ownerId,
            theatreIds: body.theatreIds || [],
            counterIds: body.counterIds || ["COUNTER-1"],
            roleKey: body.role,
            permissions: body.customPermissions || [],
            isActive: true,
          },
          { upsert: true }
        );
      }
      return successResponse(staff, "Staff created", 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_STAFF }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      const staff = await multiTheaterService.updateStaff(req.user, body.id, body);
      if (body.customPermissions || body.theatreIds || body.role) {
        await connectDB();
        const ownerId = resolveOwnerId(req.user);
        await UserTheaterMapping.findOneAndUpdate(
          { userId: body.id, ownerId },
          {
            $set: {
              ...(body.theatreIds ? { theatreIds: body.theatreIds } : {}),
              ...(body.customPermissions ? { permissions: body.customPermissions } : {}),
              ...(body.role ? { roleKey: body.role } : {}),
              ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
            },
          },
          { upsert: true }
        );
      }
      return successResponse(staff, "Updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.MANAGE_STAFF }
);
