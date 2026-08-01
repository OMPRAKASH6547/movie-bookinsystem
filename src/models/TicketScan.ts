import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketScan extends Document {
  bookingId?: mongoose.Types.ObjectId;
  bookingNumber: string;
  theatreId: mongoose.Types.ObjectId;
  showId?: mongoose.Types.ObjectId;
  scannedBy: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  result: "valid" | "invalid" | "duplicate" | "cancelled" | "expired";
  entryAt?: Date;
  exitAt?: Date;
  deviceInfo?: string;
  createdAt: Date;
}

const TicketScanSchema = new Schema<ITicketScan>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", index: true },
    bookingNumber: { type: String, required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", index: true },
    showId: { type: Schema.Types.ObjectId, ref: "Show" },
    scannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    result: {
      type: String,
      enum: ["valid", "invalid", "duplicate", "cancelled", "expired"],
      required: true,
    },
    entryAt: Date,
    exitAt: Date,
    deviceInfo: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const TicketScan: Model<ITicketScan> =
  mongoose.models.TicketScan || mongoose.model<ITicketScan>("TicketScan", TicketScanSchema);
