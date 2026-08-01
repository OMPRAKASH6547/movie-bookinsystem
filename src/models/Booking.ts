import mongoose, { Schema, Document, Model } from "mongoose";
import { BOOKING_STATUS, SEAT_TYPES } from "@/constants";
import type { BookingStatus } from "@/types";

export interface IBooking extends Document {
  bookingNumber: string;
  userId: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  seats: {
    seatId: string;
    row: string;
    number: number;
    type: string;
    price: number;
  }[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  couponCode?: string;
  status: BookingStatus;
  paymentId?: mongoose.Types.ObjectId;
  qrCode?: string;
  pdfUrl?: string;
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
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true },
    seats: [
      {
        seatId: String,
        row: String,
        number: Number,
        type: { type: String, enum: Object.values(SEAT_TYPES) },
        price: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    couponCode: String,
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    qrCode: String,
    pdfUrl: String,
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

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
