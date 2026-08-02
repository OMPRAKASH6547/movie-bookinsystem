import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { promotionService } from "@/services/promotion.service";
import { resolveOwnerId } from "@/lib/theatre/isolation";
import { Coupon } from "@/models/Coupon";
import { Offer } from "@/models/Offer";
import { connectDB } from "@/lib/db/mongodb";
import { AuditLog } from "@/models/AuditLog";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const ownerId = resolveOwnerId(req.user);
      const type = new URL(req.url).searchParams.get("type") || "all";
      const [coupons, offers] = await Promise.all([
        type === "offers" ? [] : promotionService.listCoupons(ownerId),
        type === "coupons" ? [] : promotionService.listOffers(ownerId),
      ]);
      return successResponse({ coupons, offers });
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 500);
    }
  },
  { permissionsAny: [PERMISSIONS.MANAGE_OFFERS, PERMISSIONS.MANAGE_COUPONS, PERMISSIONS.VIEW_REPORTS] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const ownerId = resolveOwnerId(req.user);
      const body = await req.json();
      const kind = body.entity || body.type;

      if (kind === "coupon") {
        if (!body.code && body.generateCode) {
          body.code = promotionService.generateCode(body.prefix || "CP");
        }
        if (!body.code) return errorResponse("Coupon code required", 422);
        if (!body.validFrom || !body.validUntil) {
          return errorResponse("validFrom and validUntil required", 422);
        }
        const coupon = await promotionService.upsertCoupon(
          {
            ...body,
            discountType: body.discountType || "percentage",
            discountValue: Number(body.discountValue || 0),
            validFrom: new Date(body.validFrom),
            validUntil: new Date(body.validUntil),
          },
          req.user.sub,
          ownerId
        );
        await AuditLog.create({
          userId: req.user.sub,
          action: "COUPON_UPSERT",
          resource: "Coupon",
          resourceId: coupon._id.toString(),
          details: { code: coupon.code },
        }).catch(() => null);
        return successResponse(coupon, "Coupon saved", 201);
      }

      if (kind === "offer") {
        if (!body.name || !body.kind) {
          return errorResponse("Offer name and kind required", 422);
        }
        if (!body.validFrom || !body.validUntil) {
          return errorResponse("validFrom and validUntil required", 422);
        }
        const offer = await promotionService.upsertOffer(
          {
            ...body,
            discountType: body.discountType || "percentage",
            discountValue: Number(body.discountValue || 0),
            validFrom: new Date(body.validFrom),
            validUntil: new Date(body.validUntil),
          },
          req.user.sub,
          ownerId
        );
        await AuditLog.create({
          userId: req.user.sub,
          action: "OFFER_UPSERT",
          resource: "Offer",
          resourceId: offer._id.toString(),
          details: { name: offer.name, kind: offer.kind },
        }).catch(() => null);
        return successResponse(offer, "Offer saved", 201);
      }

      return errorResponse("entity must be coupon or offer", 422);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permissionsAny: [PERMISSIONS.MANAGE_OFFERS, PERMISSIONS.MANAGE_COUPONS] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      await connectDB();
      const ownerId = resolveOwnerId(req.user);
      const body = await req.json();
      if (!body.id || !body.entity) {
        return errorResponse("id and entity required", 422);
      }

      if (body.entity === "coupon") {
        const coupon = await Coupon.findOne({
          _id: body.id,
          $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
        });
        if (!coupon) return errorResponse("Coupon not found", 404);
        if (typeof body.isActive === "boolean") coupon.isActive = body.isActive;
        if (body.validUntil) coupon.validUntil = new Date(body.validUntil);
        await coupon.save();
        return successResponse(coupon, "Coupon updated");
      }

      const offer = await Offer.findOne({
        _id: body.id,
        $or: [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }],
      });
      if (!offer) return errorResponse("Offer not found", 404);
      if (typeof body.isActive === "boolean") offer.isActive = body.isActive;
      if (body.validUntil) offer.validUntil = new Date(body.validUntil);
      await offer.save();
      return successResponse(offer, "Offer updated");
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permissionsAny: [PERMISSIONS.MANAGE_OFFERS, PERMISSIONS.MANAGE_COUPONS] }
);
