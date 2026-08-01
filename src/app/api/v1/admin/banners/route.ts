import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ROLES } from "@/constants/roles";
import { platformStore } from "@/lib/platform/store";
import { nanoid } from "nanoid";

export const GET = withAuth(
  async () => successResponse(await platformStore.banners.list()),
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    const items = await platformStore.banners.list();
    const banner = {
      id: `bn_${nanoid(6)}`,
      title: body.title || "New banner",
      image: body.image || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
      link: body.link || "/movies",
      active: true,
      placement: body.placement || "home_hero",
    };
    items.unshift(banner);
    await platformStore.banners.save(items);
    return successResponse(banner, "Banner created", 201);
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);

export const PATCH = withAuth(
  async (req: AuthenticatedRequest) => {
    const body = await req.json();
    if (!body.id) return errorResponse("id required", 422);
    const items = await platformStore.banners.list();
    const next = items.map((b) => (b.id === body.id ? { ...b, ...body } : b));
    await platformStore.banners.save(next);
    return successResponse(
      next.find((b) => b.id === body.id),
      "Updated"
    );
  },
  { roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
);
