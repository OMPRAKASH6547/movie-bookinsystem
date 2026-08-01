import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITheatre extends Document {
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: { type: "Point"; coordinates: [number, number] };
  amenities: string[];
  ownerId: mongoose.Types.ObjectId;
  rating: number;
  images: string[];
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  tenantId?: mongoose.Types.ObjectId;
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
    amenities: [String],
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 0 },
    images: [String],
    contactPhone: String,
    contactEmail: String,
    isActive: { type: Boolean, default: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
  },
  { timestamps: true }
);

TheatreSchema.index({ location: "2dsphere" });
TheatreSchema.index({ city: 1, isActive: 1 });

export const Theatre: Model<ITheatre> =
  mongoose.models.Theatre || mongoose.model<ITheatre>("Theatre", TheatreSchema);
