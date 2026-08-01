import mongoose, { Schema, Document, Model } from "mongoose";
import { PAYMENT_STATUS, PAYMENT_METHODS } from "@/constants";
import type { PaymentStatus, PaymentMethod } from "@/types";

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayOrderId?: string;
  gatewayResponse?: Record<string, unknown>;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    transactionId: { type: String, sparse: true, index: true },
    gatewayOrderId: String,
    gatewayResponse: Schema.Types.Mixed,
    refundId: String,
    refundAmount: Number,
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
