import mongoose, { Schema, Document, Model } from "mongoose";
import { BOOKING_STATUS, SEAT_TYPES } from "@/constants";
import type { BookingStatus } from "@/types";

export interface IBooking extends Document {
  bookingNumber: string;
  userId: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  ownerId?: mongoose.Types.ObjectId;
  seats: {
    seatId: string;
    row: string;
    number: number;
    type: string;
    price: number;
    cancelled?: boolean;
  }[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  couponCode?: string;
  offerIds?: mongoose.Types.ObjectId[];
  discountBreakdown?: {
    couponDiscount: number;
    offerDiscount: number;
    manualDiscount: number;
    labels: string[];
  };
  shift?: string;
  screenId?: mongoose.Types.ObjectId;
  status: BookingStatus;
  paymentId?: mongoose.Types.ObjectId;
  qrCode?: string;
  barcode?: string;
  pdfUrl?: string;
  channel: "online" | "pos" | "walkin";
  paymentMethod?: string;
  splitPayments?: { method: string; amount: number }[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffId?: mongoose.Types.ObjectId;
  counterId?: string;
  printCount?: number;
  checkedInAt?: Date;
  lockedUntil?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    showId: { type: Schema.Types.ObjectId, ref: "Show", required: true, index: true },
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    seats: [
      {
        seatId: String,
        row: String,
        number: Number,
        type: { type: String, enum: Object.values(SEAT_TYPES) },
        price: Number,
        cancelled: { type: Boolean, default: false },
      },
    ],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    couponCode: String,
    offerIds: [{ type: Schema.Types.ObjectId, ref: "Offer" }],
    discountBreakdown: {
      couponDiscount: { type: Number, default: 0 },
      offerDiscount: { type: Number, default: 0 },
      manualDiscount: { type: Number, default: 0 },
      labels: [String],
    },
    shift: String,
    screenId: { type: Schema.Types.ObjectId, ref: "Screen" },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    qrCode: String,
    barcode: String,
    pdfUrl: String,
    channel: {
      type: String,
      enum: ["online", "pos", "walkin"],
      default: "online",
      index: true,
    },
    paymentMethod: String,
    splitPayments: [{ method: String, amount: Number }],
    customerName: String,
    customerPhone: String,
    customerEmail: String,
    staffId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    counterId: String,
    printCount: { type: Number, default: 0 },
    checkedInAt: Date,
    lockedUntil: Date,
    cancelledAt: Date,
    cancelReason: String,
    refundAmount: Number,
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ theatreId: 1, createdAt: -1 });
BookingSchema.index({ ownerId: 1, createdAt: -1 });
BookingSchema.index({ channel: 1, createdAt: -1 });
BookingSchema.index({ staffId: 1, createdAt: -1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
