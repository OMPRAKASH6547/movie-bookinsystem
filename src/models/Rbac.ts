import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPermissionDoc extends Document {
  key: string;
  label: string;
  module: string;
  createdAt: Date;
}

export interface IRoleDoc extends Document {
  key: string;
  label: string;
  description?: string;
  isSystem: boolean;
  ownerId?: mongoose.Types.ObjectId;
  permissions: string[];
  createdAt: Date;
}

export interface IUserTheaterMapping extends Document {
  userId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  theatreIds: mongoose.Types.ObjectId[];
  counterIds: string[];
  roleKey: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermissionDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    module: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const RoleSchema = new Schema<IRoleDoc>(
  {
    key: { type: String, required: true, index: true },
    label: { type: String, required: true },
    description: String,
    isSystem: { type: Boolean, default: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

RoleSchema.index({ key: 1, ownerId: 1 }, { unique: true });

const UserTheaterMappingSchema = new Schema<IUserTheaterMapping>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreIds: [{ type: Schema.Types.ObjectId, ref: "Theatre" }],
    counterIds: [String],
    roleKey: { type: String, required: true },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserTheaterMappingSchema.index({ userId: 1, ownerId: 1 }, { unique: true });

export const PermissionModel: Model<IPermissionDoc> =
  mongoose.models.PermissionDef ||
  mongoose.model<IPermissionDoc>("PermissionDef", PermissionSchema);

export const RoleModel: Model<IRoleDoc> =
  mongoose.models.RoleDef || mongoose.model<IRoleDoc>("RoleDef", RoleSchema);

export const UserTheaterMapping: Model<IUserTheaterMapping> =
  mongoose.models.UserTheaterMapping ||
  mongoose.model<IUserTheaterMapping>("UserTheaterMapping", UserTheaterMappingSchema);
