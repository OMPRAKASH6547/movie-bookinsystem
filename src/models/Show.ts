import mongoose, { Schema, Document, Model } from "mongoose";
import { SEAT_TYPES } from "@/constants";

export interface IShow extends Document {
  movieId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  screenId: mongoose.Types.ObjectId;
  date: Date;
  startTime: Date;
  endTime: Date;
  language: string;
  format: string;
  basePrice: number;
  pricing: { seatType: string; price: number }[];
  availableSeats: number;
  totalSeats: number;
  bookedSeats: string[];
  isActive: boolean;
  createdAt: Date;
}

const ShowSchema = new Schema<IShow>(
  {
    movieId: { type: Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    screenId: { type: Schema.Types.ObjectId, ref: "Screen", required: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    language: { type: String, required: true },
    format: { type: String, default: "2D" },
    basePrice: { type: Number, required: true },
    pricing: [
      {
        seatType: { type: String, enum: Object.values(SEAT_TYPES) },
        price: Number,
      },
    ],
    availableSeats: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ShowSchema.index({ movieId: 1, date: 1, isActive: 1 });
ShowSchema.index({ theatreId: 1, date: 1 });
ShowSchema.index({ startTime: 1 });

export const Show: Model<IShow> =
  mongoose.models.Show || mongoose.model<IShow>("Show", ShowSchema);
