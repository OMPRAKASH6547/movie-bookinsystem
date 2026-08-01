import { connectDB } from "@/lib/db/mongodb";
import { Theatre } from "@/models/Theatre";
import { User } from "@/models/User";
import type { JwtPayload } from "@/types";
import { ROLES } from "@/constants/roles";
import mongoose from "mongoose";

/** Resolve owner id for theatre-scoped operations */
export function resolveOwnerId(user: JwtPayload): string {
  if (user.role === ROLES.THEATRE_OWNER || user.role === ROLES.SUPER_ADMIN) {
    return user.sub;
  }
  // Staff tokens carry owner via tenantId field reused as ownerId
  return user.tenantId || user.sub;
}

export async function getOwnerTheatreIds(
  ownerId: string,
  opts?: { includePending?: boolean }
): Promise<mongoose.Types.ObjectId[]> {
  await connectDB();
  const filter: Record<string, unknown> = { ownerId };
  if (!opts?.includePending) {
    filter.status = { $in: ["approved", "active"] };
    filter.isActive = true;
  }
  const theatres = await Theatre.find(filter).select("_id").lean();
  return theatres.map((t) => t._id as mongoose.Types.ObjectId);
}

export async function assertTheatreAccess(
  user: JwtPayload,
  theatreId: string
): Promise<boolean> {
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return true;
  await connectDB();
  const theatre = await Theatre.findById(theatreId).select("ownerId").lean();
  if (!theatre) return false;
  const ownerId = resolveOwnerId(user);
  return theatre.ownerId.toString() === ownerId;
}

export async function getStaffOwnerId(userId: string): Promise<string | null> {
  await connectDB();
  const user = await User.findById(userId)
    .select("role theatreIds tenantId ownerId")
    .lean();
  if (!user) return null;
  if (user.role === ROLES.THEATRE_OWNER) return userId;
  if ((user as { ownerId?: mongoose.Types.ObjectId }).ownerId) {
    return (user as { ownerId: mongoose.Types.ObjectId }).ownerId.toString();
  }
  if (user.tenantId) return user.tenantId.toString();
  if (user.theatreIds?.[0]) {
    const t = await Theatre.findById(user.theatreIds[0]).select("ownerId").lean();
    return t?.ownerId?.toString() || null;
  }
  return null;
}

export function parseDateRange(from?: string | null, to?: string | null) {
  const end = to ? new Date(to) : new Date();
  end.setHours(23, 59, 59, 999);
  const start = from
    ? new Date(from)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function rangePreset(preset?: string | null) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case "yesterday": {
      start.setDate(start.getDate() - 1);
      end.setTime(start.getTime());
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setDate(1);
      break;
    case "year":
      start.setMonth(0, 1);
      break;
    case "today":
    default:
      break;
  }
  return { start, end };
}
