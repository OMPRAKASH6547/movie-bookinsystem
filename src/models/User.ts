import mongoose, { Schema, Document, Model } from "mongoose";
import type { Role } from "@/constants/roles";
import { ROLES } from "@/constants/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  provider: "credentials" | "google" | "github" | "guest";
  providerId?: string;
  wishlist: mongoose.Types.ObjectId[];
  favorites: mongoose.Types.ObjectId[];
  rewardPoints: number;
  referralCode: string;
  referredBy?: string;
  tenantId?: mongoose.Types.ObjectId;
  theatreIds: mongoose.Types.ObjectId[];
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerifyToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, select: false },
    phone: { type: String, sparse: true, index: true },
    avatar: String,
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    provider: {
      type: String,
      enum: ["credentials", "google", "github", "guest"],
      default: "credentials",
    },
    providerId: String,
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    favorites: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    rewardPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: String,
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant" },
    theatreIds: [{ type: Schema.Types.ObjectId, ref: "Theatre" }],
    lastLoginAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerifyToken: String,
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
