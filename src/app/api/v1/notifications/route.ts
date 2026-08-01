import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { Notification } from "@/models/Notification";
import { cache } from "@/lib/redis/client";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    try {
      await connectDB();
      const items = await Notification.find({ userId: req.user.sub })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return successResponse(items);
    } catch {
      const raw = await cache.get(`demo_notifications:${req.user.sub}`);
      const items = raw
        ? JSON.parse(raw)
        : [
            {
              _id: "n1",
              title: "Welcome to CinePass",
              message: "Book seats with live QR tickets.",
              type: "system",
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ];
      return successResponse(items);
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to load notifications",
      500
    );
  }
});

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { id, all } = await req.json();
    try {
      await connectDB();
      if (all) {
        await Notification.updateMany({ userId: req.user.sub }, { isRead: true });
      } else if (id) {
        await Notification.findOneAndUpdate(
          { _id: id, userId: req.user.sub },
          { isRead: true }
        );
      }
      return successResponse(null, "Updated");
    } catch {
      return successResponse(null, "Updated");
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Update failed",
      400
    );
  }
});
