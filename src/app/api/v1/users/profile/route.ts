import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { resolvePermissions } from "@/constants/roles";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    await connectDB();
    const user = await User.findById(req.user.sub).select("-password");
    if (!user) {
      return successResponse({
        id: req.user.sub,
        email: req.user.email,
        name: req.user.email.split("@")[0],
        role: req.user.role,
        referralCode: "CINEPASS-REF",
        rewardPoints: 0,
        isEmailVerified: false,
        permissions: resolvePermissions(req.user.role),
      });
    }
    return successResponse({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      referralCode: user.referralCode,
      rewardPoints: user.rewardPoints,
      isEmailVerified: user.isEmailVerified,
      customPermissions: user.customPermissions,
      permissions: resolvePermissions(user.role, user.customPermissions),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed", 500);
  }
});

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    await connectDB();
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      {
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.avatar ? { avatar: body.avatar } : {}),
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return successResponse(
        {
          id: req.user.sub,
          email: req.user.email,
          name: body.name || req.user.email.split("@")[0],
          phone: body.phone,
          role: req.user.role,
        },
        "Profile updated (offline)"
      );
    }

    return successResponse(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        rewardPoints: user.rewardPoints,
      },
      "Profile updated"
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Update failed", 400);
  }
});
