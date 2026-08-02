import mongoose, { Schema, Document, Model } from "mongoose";
import type { DiscountKind, AudienceRule } from "./Coupon";

export type OfferKind =
  | "auto_promo"
  | "festival"
  | "first_booking"
  | "bogo"
  | "flat"
  | "seat_category"
  | "show_time"
  | "theatre"
  | "payment_method"
  | "special_event";

export interface IOffer extends Document {
  ownerId?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  kind: OfferKind;
  discountType: DiscountKind;
  discountValue: number;
  buyQuantity?: number;
  getQuantity?: number;
  minAmount: number;
  maxDiscount?: number;
  autoApply: boolean;
  stackable: boolean;
  priority: number;
  audience: AudienceRule;
  specificUserIds?: mongoose.Types.ObjectId[];
  firstBookingOnly: boolean;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableTheatres?: mongoose.Types.ObjectId[];
  applicableMovies?: mongoose.Types.ObjectId[];
  applicableScreens?: mongoose.Types.ObjectId[];
  applicableShows?: mongoose.Types.ObjectId[];
  applicableSeatCategories?: string[];
  applicableTimeSlots?: string[];
  applicablePaymentMethods?: string[];
  applicableWeekdays?: number[];
  usageLimit?: number;
  usedCount: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    kind: {
      type: String,
      enum: [
        "auto_promo",
        "festival",
        "first_booking",
        "bogo",
        "flat",
        "seat_category",
        "show_time",
        "theatre",
        "payment_method",
        "special_event",
      ],
      required: true,
      index: true,
    },
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
    autoApply: { type: Boolean, default: true },
    stackable: { type: Boolean, default: false },
    priority: { type: Number, default: 100 },
    audience: {
      type: String,
      enum: ["all", "new_users", "existing_users", "specific_users"],
      default: "all",
    },
    specificUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    firstBookingOnly: { type: Boolean, default: false },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    applicableTheatres: [{ type: Schema.Types.ObjectId, ref: "Theatre" }],
    applicableMovies: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    applicableScreens: [{ type: Schema.Types.ObjectId, ref: "Screen" }],
    applicableShows: [{ type: Schema.Types.ObjectId, ref: "Show" }],
    applicableSeatCategories: [String],
    applicableTimeSlots: [String],
    applicablePaymentMethods: [String],
    applicableWeekdays: [Number],
    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

OfferSchema.index({ isActive: 1, autoApply: 1, validFrom: 1, validUntil: 1 });
OfferSchema.index({ ownerId: 1, isActive: 1 });

export const Offer: Model<IOffer> =
  mongoose.models.Offer || mongoose.model<IOffer>("Offer", OfferSchema);
