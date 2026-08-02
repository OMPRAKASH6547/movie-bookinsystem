import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICouponRedemption extends Document {
  ownerId?: mongoose.Types.ObjectId;
  couponId?: mongoose.Types.ObjectId;
  offerId?: mongoose.Types.ObjectId;
  code?: string;
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  channel: "online" | "pos" | "walkin";
  discountAmount: number;
  bookingAmount: number;
  theatreId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", index: true },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", index: true },
    code: { type: String, uppercase: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User" },
    channel: { type: String, enum: ["online", "pos", "walkin"], required: true },
    discountAmount: { type: Number, required: true },
    bookingAmount: { type: Number, required: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ code: 1, userId: 1 });

export const CouponRedemption: Model<ICouponRedemption> =
  mongoose.models.CouponRedemption ||
  mongoose.model<ICouponRedemption>("CouponRedemption", CouponRedemptionSchema);
