import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { platformStore } from "@/lib/platform/store";

export const GET = withAuth(
  async () => successResponse(await platformStore.flags.list()),
  { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    const { id } = await req.json();
    if (!id) return errorResponse("id required", 422);
    const flags = await platformStore.flags.toggle(id);
    return successResponse(flags, "Flag toggled");
  },
  { roles: [ROLES.SUPER_ADMIN] }
);
