import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStaffSession extends Document {
  userId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  theatreId?: mongoose.Types.ObjectId;
  loginAt: Date;
  logoutAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  counterId?: string;
  ticketsBooked: number;
  ticketsCancelled: number;
  revenueGenerated: number;
  refundAmount: number;
  lastActivityAt: Date;
  isActive: boolean;
}

export interface IStaffActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  theatreId?: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const StaffSessionSchema = new Schema<IStaffSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre", index: true },
    loginAt: { type: Date, default: Date.now },
    logoutAt: Date,
    ipAddress: String,
    userAgent: String,
    device: String,
    browser: String,
    counterId: String,
    ticketsBooked: { type: Number, default: 0 },
    ticketsCancelled: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const StaffActivityLogSchema = new Schema<IStaffActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreId: { type: Schema.Types.ObjectId, ref: "Theatre" },
    sessionId: { type: Schema.Types.ObjectId, ref: "StaffSession" },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: String,
    meta: Schema.Types.Mixed,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StaffSessionSchema.index({ ownerId: 1, loginAt: -1 });
StaffActivityLogSchema.index({ ownerId: 1, createdAt: -1 });

export const StaffSession: Model<IStaffSession> =
  mongoose.models.StaffSession ||
  mongoose.model<IStaffSession>("StaffSession", StaffSessionSchema);

export const StaffActivityLog: Model<IStaffActivityLog> =
  mongoose.models.StaffActivityLog ||
  mongoose.model<IStaffActivityLog>("StaffActivityLog", StaffActivityLogSchema);
