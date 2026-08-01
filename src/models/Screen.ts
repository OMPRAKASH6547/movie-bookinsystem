import mongoose, { Schema, Document, Model } from "mongoose";
import { SEAT_TYPES } from "@/constants";

export interface ISeat {
  id: string;
  row: string;
  number: number;
  type: string;
  price: number;
  isAvailable: boolean;
  isAisle?: boolean;
}

export interface IScreen extends Document {
  theatreId: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  screenType: "2D" | "3D" | "IMAX" | "4DX" | "DOLBY";
  seatLayout: {
    rows: number;
    columns: number;
    seats: ISeat[];
  };
  isActive: boolean;
}

const SeatSchema = new Schema(
  {
    id: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true },
    type: { type: String, enum: Object.values(SEAT_TYPES), default: SEAT_TYPES.REGULAR },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    isAisle: Boolean,
  },
  { _id: false }
);

const ScreenSchema = new Schema<IScreen>(
  {
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    screenType: {
      type: String,
      enum: ["2D", "3D", "IMAX", "4DX", "DOLBY"],
      default: "2D",
    },
    seatLayout: {
      rows: Number,
      columns: Number,
      seats: [SeatSchema],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Screen: Model<IScreen> =
  mongoose.models.Screen || mongoose.model<IScreen>("Screen", ScreenSchema);
