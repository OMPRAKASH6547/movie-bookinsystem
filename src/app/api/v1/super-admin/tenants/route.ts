import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { platformStore } from "@/lib/platform/store";

export const GET = withAuth(
  async () => successResponse(await platformStore.tenants.list()),
  { roles: [ROLES.SUPER_ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    if (!body.name) return errorResponse("name required", 422);
    const tenant = await platformStore.tenants.upsert(body);
    return successResponse(tenant, "Tenant created", 201);
  },
  { roles: [ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    if (!body.id) return errorResponse("id required", 422);
    const tenant = await platformStore.tenants.upsert(body);
    return successResponse(tenant, "Tenant updated");
  },
  { roles: [ROLES.SUPER_ADMIN] }
);
