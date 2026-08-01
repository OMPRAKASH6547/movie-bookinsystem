import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse, paginate } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { Theatre } from "@/models/Theatre";
import { slugify } from "@/utils/format";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const page = Number(new URL(req.url).searchParams.get("page") || 1);
    const limit = Number(new URL(req.url).searchParams.get("limit") || 50);
    try {
      await connectDB();
      const [items, total] = await Promise.all([
        Theatre.find()
          .populate("ownerId", "name email")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Theatre.countDocuments(),
      ]);
      return successResponse(items, "OK", 200, paginate(page, limit, total));
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed", 500);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.THEATRE_OWNER] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      await connectDB();
      const theatre = await Theatre.create({
        name: body.name,
        slug: slugify(body.name),
        address: body.address || "",
        city: body.city || "Mumbai",
        state: body.state || "Maharashtra",
        pincode: body.pincode || "400001",
        location: {
          type: "Point",
          coordinates: body.coordinates || [72.8777, 19.076],
        },
        amenities: body.amenities || ["Dolby", "Parking"],
        ownerId: body.ownerId || req.user.sub,
        images: body.images || [],
        isActive: true,
      });
      return successResponse(theatre, "Theatre created", 201);
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Create failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.THEATRE_OWNER] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id) return errorResponse("id required", 422);
      await connectDB();
      const theatre = await Theatre.findByIdAndUpdate(body.id, body, { new: true });
      if (!theatre) return errorResponse("Not found", 404);
      return successResponse(theatre, "Updated");
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Update failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.THEATRE_OWNER] }
);
