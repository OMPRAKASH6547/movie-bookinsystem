import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { authService } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const user = await authService.getProfile(req.user.sub);
    return successResponse(user);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch profile",
      404
    );
  }
});
