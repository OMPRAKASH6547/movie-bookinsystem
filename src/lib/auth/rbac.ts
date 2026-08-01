import type { Role, Permission } from "@/constants/roles";
import { ROLE_PERMISSIONS } from "@/constants/roles";
import type { JwtPayload } from "@/types";

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAccess(payload: JwtPayload, permission: Permission): boolean {
  return payload.permissions.includes(permission) || hasPermission(payload.role, permission);
}
