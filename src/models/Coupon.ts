import mongoose, { Schema, Document, Model } from "mongoose";

export type DiscountKind = "percentage" | "fixed" | "bogo" | "flat";
export type AudienceRule = "all" | "new_users" | "existing_users" | "specific_users";

export interface ICoupon extends Document {
  ownerId?: mongoose.Types.ObjectId;
  code: string;
  name: string;
  description: string;
  discountType: DiscountKind;
  discountValue: number;
  /** For BOGO: buy X get Y */
  buyQuantity?: number;
  getQuantity?: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  oneTimePerCustomer: boolean;
  audience: AudienceRule;
  specificUserIds?: mongoose.Types.ObjectId[];
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  stackable: boolean;
  firstBookingOnly: boolean;
  applicableTheatres?: mongoose.Types.ObjectId[];
  applicableMovies?: mongoose.Types.ObjectId[];
  applicableScreens?: mongoose.Types.ObjectId[];
  applicableShows?: mongoose.Types.ObjectId[];
  applicableSeatCategories?: string[];
  /** HH:mm windows, e.g. ["09:00-12:00","18:00-21:00"] */
  applicableTimeSlots?: string[];
  applicablePaymentMethods?: string[];
  /** weekdays 0=Sun .. 6=Sat; empty = all */
  applicableWeekdays?: number[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    code: { type: String, required: true, uppercase: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "bogo", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    buyQuantity: Number,
    getQuantity: Number,
    minAmount: { type: Number, default: 0 },
    maxDiscount: Number,
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    oneTimePerCustomer: { type: Boolean, default: false },
    audience: {
      type: String,
      enum: ["all", "new_users", "existing_users", "specific_users"],
      default: "all",
    },
    specificUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    stackable: { type: Boolean, default: false },
    firstBookingOnly: { type: Boolean, default: false },
    applicableTheatres: [{ type: Schema.Types.ObjectId, ref: "Theatre" }],
    applicableMovies: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    applicableScreens: [{ type: Schema.Types.ObjectId, ref: "Screen" }],
    applicableShows: [{ type: Schema.Types.ObjectId, ref: "Show" }],
    applicableSeatCategories: [String],
    applicableTimeSlots: [String],
    applicablePaymentMethods: [String],
    applicableWeekdays: [Number],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1, ownerId: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
