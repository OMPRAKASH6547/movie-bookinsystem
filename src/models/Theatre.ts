import mongoose, { Schema, Document, Model } from "mongoose";

export type TheatreStatus = "pending" | "approved" | "rejected" | "suspended" | "active";

export interface ITheatre extends Document {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: { type: "Point"; coordinates: [number, number] };
  mapUrl?: string;
  amenities: string[];
  ownerId: mongoose.Types.ObjectId;
  rating: number;
  images: string[];
  contactPhone?: string;
  contactEmail?: string;
  gstNumber?: string;
  gstLegalName?: string;
  capacity?: number;
  screenCount?: number;
  status: TheatreStatus;
  isActive: boolean;
  commissionRate: number;
  approvalNote?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  settings?: {
    seatLockMinutes?: number;
    allowOnlineBooking?: boolean;
    allowPosBooking?: boolean;
    thermalPrinterWidth?: 58 | 80;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TheatreSchema = new Schema<ITheatre>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    mapUrl: String,
    amenities: [String],
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, default: 0 },
    images: [String],
    contactPhone: String,
    contactEmail: String,
    gstNumber: String,
    gstLegalName: String,
    capacity: { type: Number, default: 0 },
    screenCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended", "active"],
      default: "pending",
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    commissionRate: { type: Number, default: 10 },
    approvalNote: String,
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    settings: {
      seatLockMinutes: { type: Number, default: 10 },
      allowOnlineBooking: { type: Boolean, default: true },
      allowPosBooking: { type: Boolean, default: true },
      thermalPrinterWidth: { type: Number, enum: [58, 80], default: 80 },
    },
  },
  { timestamps: true }
);

TheatreSchema.index({ location: "2dsphere" });
TheatreSchema.index({ ownerId: 1, status: 1 });
TheatreSchema.index({ city: 1, isActive: 1 });

export const Theatre: Model<ITheatre> =
  mongoose.models.Theatre || mongoose.model<ITheatre>("Theatre", TheatreSchema);
