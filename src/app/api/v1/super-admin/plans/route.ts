import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { platformStore } from "@/lib/platform/store";
import { nanoid } from "nanoid";

export const GET = withAuth(
  async () => successResponse(await platformStore.plans.list()),
  { roles: [ROLES.SUPER_ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    const items = await platformStore.plans.list();
    const plan = {
      id: `pl_${nanoid(6)}`,
      name: body.name || "Custom",
      price: Number(body.price || 0),
      theatres: Number(body.theatres || 1),
      features: body.features || [],
      active: true,
    };
    items.push(plan);
    await platformStore.plans.save(items);
    return successResponse(plan, "Plan created", 201);
  },
  { roles: [ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    if (!body.id) return errorResponse("id required", 422);
    const items = await platformStore.plans.list();
    const next = items.map((p) => (p.id === body.id ? { ...p, ...body } : p));
    await platformStore.plans.save(next);
    return successResponse(
      next.find((p) => p.id === body.id),
      "Updated"
    );
  },
  { roles: [ROLES.SUPER_ADMIN] }
);
