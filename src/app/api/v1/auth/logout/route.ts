import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { authService } from "@/services/auth.service";
import { successResponse } from "@/utils/api-response";

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  await authService.logout(req.user.sessionId);
  const response = successResponse(null, "Logged out successfully");
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
});
