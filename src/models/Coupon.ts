import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableMovies?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    description: { type: String, required: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    minAmount: { type: Number, default: 0 },
    maxDiscount: Number,
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableMovies: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
  },
  { timestamps: true }
);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
