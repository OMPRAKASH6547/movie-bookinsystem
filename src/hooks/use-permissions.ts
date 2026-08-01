"use client";

import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/constants/roles";
import { ROLES } from "@/constants/roles";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const perms = new Set(user?.permissions || []);

  const can = (permission: Permission) => {
    if (!user) return false;
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return perms.has(permission);
  };

  const canAny = (permissions: Permission[]) =>
    permissions.some((p) => can(p));

  const canAll = (permissions: Permission[]) =>
    permissions.every((p) => can(p));

  return { user, permissions: user?.permissions || [], can, canAny, canAll };
}
