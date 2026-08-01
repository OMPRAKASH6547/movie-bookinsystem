import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { platformStore } from "@/lib/platform/store";

export const GET = withAuth(
  async () => successResponse(await platformStore.support.list()),
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    const { id, status } = await req.json();
    if (!id || !status) return errorResponse("id and status required", 422);
    const ticket = await platformStore.support.updateStatus(id, status);
    return successResponse(ticket, "Ticket updated");
  },
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);
