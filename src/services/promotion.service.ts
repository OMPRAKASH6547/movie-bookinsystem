import mongoose from "mongoose";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { Offer, type IOffer } from "@/models/Offer";
import { CouponRedemption } from "@/models/CouponRedemption";
import { Booking } from "@/models/Booking";
import { connectDB } from "@/lib/db/mongodb";
import { AuditLog } from "@/models/AuditLog";

export interface PromotionContext {
  amount: number;
  userId?: string;
  ownerId?: string;
  theatreId?: string;
  movieId?: string;
  screenId?: string;
  showId?: string;
  seatCategories?: string[];
  paymentMethod?: string;
  showDateTime?: Date;
  channel?: "online" | "pos" | "walkin";
  allowStacking?: boolean;
  manualDiscount?: number;
}

export interface AppliedPromotion {
  source: "coupon" | "offer" | "manual";
  id?: string;
  code?: string;
  name: string;
  discount: number;
  stackable: boolean;
}

export interface PromotionResult {
  discount: number;
  couponDiscount: number;
  offerDiscount: number;
  manualDiscount: number;
  finalAmount: number;
  couponCode?: string;
  couponId?: string;
  offerIds: string[];
  labels: string[];
  applied: AppliedPromotion[];
}

function idIn(list: mongoose.Types.ObjectId[] | undefined, id?: string) {
  if (!list?.length || !id) return true;
  return list.some((x) => x.toString() === id);
}

function timeInSlots(slots: string[] | undefined, dt: Date) {
  if (!slots?.length) return true;
  const hh = dt.getHours().toString().padStart(2, "0");
  const mm = dt.getMinutes().toString().padStart(2, "0");
  const mins = Number(hh) * 60 + Number(mm);
  return slots.some((slot) => {
    const [a, b] = slot.split("-");
    if (!a || !b) return false;
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    const start = ah * 60 + am;
    const end = bh * 60 + bm;
    return mins >= start && mins <= end;
  });
}

function calcDiscount(
  type: string,
  value: number,
  amount: number,
  seats: string[] | undefined,
  maxDiscount?: number,
  buyQty?: number,
  getQty?: number
): number {
  let discount = 0;
  if (type === "percentage") {
    discount = (amount * value) / 100;
  } else if (type === "fixed" || type === "flat") {
    discount = value;
  } else if (type === "bogo") {
    const buy = buyQty || 1;
    const get = getQty || 1;
    const seatCount = seats?.length || 1;
    const freeSets = Math.floor(seatCount / (buy + get)) * get;
    const avg = seatCount > 0 ? amount / seatCount : 0;
    discount = freeSets * avg;
  }
  if (maxDiscount != null) discount = Math.min(discount, maxDiscount);
  return Math.max(0, Math.min(Math.round(discount), amount));
}

async function audienceOk(
  audience: string,
  specificUserIds: mongoose.Types.ObjectId[] | undefined,
  userId?: string,
  firstBookingOnly?: boolean
) {
  if (!userId) {
    if (audience === "all" && !firstBookingOnly) return true;
    if (audience === "new_users" || firstBookingOnly) return true;
    return audience === "all";
  }

  if (audience === "specific_users") {
    if (!specificUserIds?.some((id) => id.toString() === userId)) {
      throw new Error("Coupon not valid for this user");
    }
  }

  const prior = await Booking.countDocuments({
    userId,
    status: { $in: ["confirmed", "checked_in", "completed"] },
  });

  if (audience === "new_users" || firstBookingOnly) {
    if (prior > 0) throw new Error("Offer valid for first booking / new users only");
  }
  if (audience === "existing_users" && prior === 0) {
    throw new Error("Offer valid for existing customers only");
  }
  return true;
}

function scopeOk(
  entity: {
    applicableTheatres?: mongoose.Types.ObjectId[];
    applicableMovies?: mongoose.Types.ObjectId[];
    applicableScreens?: mongoose.Types.ObjectId[];
    applicableShows?: mongoose.Types.ObjectId[];
    applicableSeatCategories?: string[];
    applicableTimeSlots?: string[];
    applicablePaymentMethods?: string[];
    applicableWeekdays?: number[];
    minAmount: number;
  },
  ctx: PromotionContext
) {
  if (ctx.amount < entity.minAmount) {
    throw new Error(`Minimum amount ₹${entity.minAmount} required`);
  }
  if (!idIn(entity.applicableTheatres, ctx.theatreId)) {
    throw new Error("Not valid for this theatre");
  }
  if (!idIn(entity.applicableMovies, ctx.movieId)) {
    throw new Error("Not valid for this movie");
  }
  if (!idIn(entity.applicableScreens, ctx.screenId)) {
    throw new Error("Not valid for this screen");
  }
  if (!idIn(entity.applicableShows, ctx.showId)) {
    throw new Error("Not valid for this show");
  }
  if (entity.applicableSeatCategories?.length && ctx.seatCategories?.length) {
    const ok = ctx.seatCategories.some((c) =>
      entity.applicableSeatCategories!.includes(c)
    );
    if (!ok) throw new Error("Not valid for selected seat category");
  }
  if (
    entity.applicablePaymentMethods?.length &&
    ctx.paymentMethod &&
    !entity.applicablePaymentMethods.includes(ctx.paymentMethod)
  ) {
    throw new Error("Not valid for this payment method");
  }
  const dt = ctx.showDateTime || new Date();
  if (entity.applicableWeekdays?.length && !entity.applicableWeekdays.includes(dt.getDay())) {
    throw new Error("Not valid on this day");
  }
  if (!timeInSlots(entity.applicableTimeSlots, dt)) {
    throw new Error("Not valid for this show time");
  }
}

export class PromotionService {
  async validateCoupon(code: string, ctx: PromotionContext): Promise<AppliedPromotion> {
    await connectDB();
    const now = new Date();
    const query: Record<string, unknown> = {
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    };
    if (ctx.ownerId) {
      query.$or = [{ ownerId: ctx.ownerId }, { ownerId: null }, { ownerId: { $exists: false } }];
    }

    const coupon = await Coupon.findOne(query);
    if (!coupon) throw new Error("Invalid or expired coupon");
    if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");

    await audienceOk(coupon.audience, coupon.specificUserIds, ctx.userId, coupon.firstBookingOnly);
    scopeOk(coupon, ctx);

    if (ctx.userId) {
      const userUses = await CouponRedemption.countDocuments({
        couponId: coupon._id,
        userId: ctx.userId,
      });
      const limit = coupon.oneTimePerCustomer ? 1 : coupon.perUserLimit;
      if (userUses >= limit) {
        throw new Error(
          coupon.oneTimePerCustomer
            ? "Coupon already used by this customer"
            : "Per-user coupon limit reached"
        );
      }
    }

    const discount = calcDiscount(
      coupon.discountType,
      coupon.discountValue,
      ctx.amount,
      ctx.seatCategories,
      coupon.maxDiscount,
      coupon.buyQuantity,
      coupon.getQuantity
    );

    return {
      source: "coupon",
      id: coupon._id.toString(),
      code: coupon.code,
      name: coupon.name || coupon.code,
      discount,
      stackable: coupon.stackable,
    };
  }

  async findAutoOffers(ctx: PromotionContext): Promise<AppliedPromotion[]> {
    await connectDB();
    const now = new Date();
    const query: Record<string, unknown> = {
      isActive: true,
      autoApply: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    };
    if (ctx.ownerId) {
      query.$or = [{ ownerId: ctx.ownerId }, { ownerId: null }, { ownerId: { $exists: false } }];
    }

    const offers = await Offer.find(query).sort({ priority: 1 }).lean();
    const applied: AppliedPromotion[] = [];

    for (const offer of offers) {
      try {
        if (offer.usageLimit != null && offer.usedCount >= offer.usageLimit) continue;
        await audienceOk(
          offer.audience,
          offer.specificUserIds as mongoose.Types.ObjectId[] | undefined,
          ctx.userId,
          offer.firstBookingOnly || offer.kind === "first_booking"
        );
        scopeOk(offer as unknown as IOffer, ctx);
        const discount = calcDiscount(
          offer.discountType,
          offer.discountValue,
          ctx.amount,
          ctx.seatCategories,
          offer.maxDiscount,
          offer.buyQuantity,
          offer.getQuantity
        );
        if (discount <= 0) continue;
        applied.push({
          source: "offer",
          id: offer._id.toString(),
          name: offer.name,
          discount,
          stackable: offer.stackable,
        });
      } catch {
        /* offer not applicable */
      }
    }
    return applied;
  }

  /**
   * Resolve coupon + auto offers + optional manual discount with stacking rules.
   * Default: single best non-stackable promotion wins; stackable ones can add.
   */
  async resolve(ctx: PromotionContext & { couponCode?: string }): Promise<PromotionResult> {
    const applied: AppliedPromotion[] = [];
    let couponPromo: AppliedPromotion | undefined;

    if (ctx.couponCode) {
      couponPromo = await this.validateCoupon(ctx.couponCode, ctx);
      applied.push(couponPromo);
    }

    const offers = await this.findAutoOffers(ctx);
    const allowStack = ctx.allowStacking || couponPromo?.stackable;

    if (allowStack) {
      for (const o of offers.filter((x) => x.stackable)) {
        if (!applied.some((a) => a.id === o.id)) applied.push(o);
      }
    } else if (!couponPromo) {
      // pick best single offer
      const best = offers.sort((a, b) => b.discount - a.discount)[0];
      if (best) applied.push(best);
    } else if (couponPromo.stackable) {
      for (const o of offers.filter((x) => x.stackable)) applied.push(o);
    }
    // If coupon is not stackable, ignore auto offers (prevent invalid combinations)

    const manual = Math.max(0, Math.round(ctx.manualDiscount || 0));
    if (manual > 0) {
      if (applied.some((a) => !a.stackable) && !ctx.allowStacking) {
        throw new Error("Manual discount cannot combine with non-stackable offers");
      }
      applied.push({
        source: "manual",
        name: "Manual discount",
        discount: manual,
        stackable: true,
      });
    }

    let remaining = ctx.amount;
    let couponDiscount = 0;
    let offerDiscount = 0;
    let manualDiscount = 0;
    const labels: string[] = [];
    const offerIds: string[] = [];

    for (const item of applied) {
      const d = Math.min(item.discount, remaining);
      remaining -= d;
      if (item.source === "coupon") {
        couponDiscount += d;
        labels.push(item.code || item.name);
      } else if (item.source === "offer") {
        offerDiscount += d;
        if (item.id) offerIds.push(item.id);
        labels.push(item.name);
      } else {
        manualDiscount += d;
        labels.push(item.name);
      }
    }

    const discount = couponDiscount + offerDiscount + manualDiscount;
    return {
      discount,
      couponDiscount,
      offerDiscount,
      manualDiscount,
      finalAmount: Math.max(0, ctx.amount - discount),
      couponCode: couponPromo?.code,
      couponId: couponPromo?.id,
      offerIds,
      labels,
      applied,
    };
  }

  async recordRedemption(input: {
    ownerId?: string;
    couponId?: string;
    offerIds?: string[];
    code?: string;
    bookingId: string;
    userId: string;
    staffId?: string;
    channel: "online" | "pos" | "walkin";
    discountAmount: number;
    bookingAmount: number;
    theatreId?: string;
    actorId?: string;
  }) {
    await connectDB();
    if (input.couponId && input.code) {
      await Coupon.updateOne({ _id: input.couponId }, { $inc: { usedCount: 1 } });
      await CouponRedemption.create({
        ownerId: input.ownerId,
        couponId: input.couponId,
        code: input.code,
        bookingId: input.bookingId,
        userId: input.userId,
        staffId: input.staffId,
        channel: input.channel,
        discountAmount: input.discountAmount,
        bookingAmount: input.bookingAmount,
        theatreId: input.theatreId,
      });
    }
    if (input.offerIds?.length) {
      await Offer.updateMany(
        { _id: { $in: input.offerIds } },
        { $inc: { usedCount: 1 } }
      );
      for (const offerId of input.offerIds) {
        await CouponRedemption.create({
          ownerId: input.ownerId,
          offerId,
          bookingId: input.bookingId,
          userId: input.userId,
          staffId: input.staffId,
          channel: input.channel,
          discountAmount: input.discountAmount,
          bookingAmount: input.bookingAmount,
          theatreId: input.theatreId,
        });
      }
    }
    if (input.actorId && (input.code || input.offerIds?.length)) {
      await AuditLog.create({
        userId: input.actorId,
        action: "PROMOTION_REDEEMED",
        resource: "Booking",
        resourceId: input.bookingId,
        details: {
          code: input.code,
          offerIds: input.offerIds,
          discount: input.discountAmount,
          channel: input.channel,
        },
      }).catch(() => null);
    }
  }

  async listCoupons(ownerId?: string) {
    await connectDB();
    const q: Record<string, unknown> = {};
    if (ownerId) q.$or = [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }];
    return Coupon.find(q).sort({ createdAt: -1 }).lean();
  }

  async listOffers(ownerId?: string) {
    await connectDB();
    const q: Record<string, unknown> = {};
    if (ownerId) q.$or = [{ ownerId }, { ownerId: null }, { ownerId: { $exists: false } }];
    return Offer.find(q).sort({ priority: 1, createdAt: -1 }).lean();
  }

  async upsertCoupon(data: Partial<ICoupon> & { code: string }, userId: string, ownerId?: string) {
    await connectDB();
    const code = data.code.toUpperCase();
    const payload = {
      ...data,
      code,
      name: data.name || code,
      ownerId: ownerId || data.ownerId,
      createdBy: userId,
    };
    const existing = await Coupon.findOne({ code, ownerId: ownerId || null });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return existing;
    }
    return Coupon.create(payload);
  }

  async upsertOffer(data: Partial<IOffer> & { name: string; kind: string }, userId: string, ownerId?: string) {
    await connectDB();
    if (data._id) {
      const offer = await Offer.findById(data._id);
      if (!offer) throw new Error("Offer not found");
      if (ownerId && offer.ownerId && offer.ownerId.toString() !== ownerId) {
        throw new Error("Access denied");
      }
      Object.assign(offer, data, { ownerId: ownerId || offer.ownerId });
      await offer.save();
      return offer;
    }
    return Offer.create({
      ...data,
      ownerId,
      createdBy: userId,
    });
  }

  generateCode(prefix = "CP") {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${rand}`;
  }
}

export const promotionService = new PromotionService();
