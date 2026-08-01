import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";
import { Coupon } from "@/models/Coupon";
import { cache } from "@/lib/redis/client";

const FALLBACK = [
  {
    _id: "c1",
    code: "CINEPASS50",
    description: "50% off",
    discountType: "percentage",
    discountValue: 50,
    minAmount: 200,
    maxDiscount: 250,
    usageLimit: 10000,
    usedCount: 128,
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 90 * 864e5).toISOString(),
  },
  {
    _id: "c2",
    code: "STUDENT20",
    description: "Student special",
    discountType: "percentage",
    discountValue: 20,
    minAmount: 150,
    usageLimit: 5000,
    usedCount: 64,
    isActive: true,
    validFrom: new Date().toISOString(),
    validUntil: new Date(Date.now() + 90 * 864e5).toISOString(),
  },
];

export const GET = withAuth(
  async () => {
    try {
      await connectDB();
      const items = await Coupon.find().sort({ createdAt: -1 }).lean();
      if (items.length) return successResponse(items);
    } catch {
      /* fallback */
    }
    const raw = await cache.get("admin:coupons");
    return successResponse(raw ? JSON.parse(raw) : FALLBACK);
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.code) return errorResponse("code required", 422);
      try {
        await connectDB();
        const coupon = await Coupon.create({
          code: String(body.code).toUpperCase(),
          description: body.description || body.code,
          discountType: body.discountType || "percentage",
          discountValue: Number(body.discountValue || 10),
          minAmount: Number(body.minAmount || 0),
          maxDiscount: body.maxDiscount,
          usageLimit: Number(body.usageLimit || 1000),
          perUserLimit: 1,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 90 * 864e5),
          isActive: true,
        });
        return successResponse(coupon, "Coupon created", 201);
      } catch {
        const raw = await cache.get("admin:coupons");
        const list = raw ? JSON.parse(raw) : [...FALLBACK];
        const coupon = {
          _id: `c_${Date.now()}`,
          code: String(body.code).toUpperCase(),
          description: body.description || body.code,
          discountType: body.discountType || "percentage",
          discountValue: Number(body.discountValue || 10),
          minAmount: Number(body.minAmount || 0),
          usageLimit: 1000,
          usedCount: 0,
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 90 * 864e5).toISOString(),
        };
        list.unshift(coupon);
        await cache.set("admin:coupons", JSON.stringify(list), 60 * 60 * 24 * 90);
        return successResponse(coupon, "Coupon created", 201);
      }
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (!body.id && !body.code) return errorResponse("id or code required", 422);
      try {
        await connectDB();
        const coupon = body.id
          ? await Coupon.findByIdAndUpdate(body.id, body, { new: true })
          : await Coupon.findOneAndUpdate({ code: body.code }, body, { new: true });
        if (!coupon) return errorResponse("Not found", 404);
        return successResponse(coupon, "Updated");
      } catch {
        const raw = await cache.get("admin:coupons");
        const list = raw ? JSON.parse(raw) : [...FALLBACK];
        const next = list.map((c: { _id: string; code: string }) =>
          c._id === body.id || c.code === body.code ? { ...c, ...body } : c
        );
        await cache.set("admin:coupons", JSON.stringify(next), 60 * 60 * 24 * 90);
        return successResponse(
          next.find((c: { _id: string; code: string }) => c._id === body.id || c.code === body.code),
          "Updated"
        );
      }
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Failed", 400);
    }
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);
