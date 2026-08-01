import type { Role, Permission } from "@/constants/roles";
import { ROLE_PERMISSIONS, resolvePermissions } from "@/constants/roles";
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

/** Effective permissions from JWT (role + custom grants already merged at login). */
export function getEffectivePermissions(payload: JwtPayload): Permission[] {
  if (payload.permissions?.length) {
    return payload.permissions as Permission[];
  }
  return resolvePermissions(payload.role);
}

export function canAccess(payload: JwtPayload, permission: Permission): boolean {
  const perms = getEffectivePermissions(payload);
  return perms.includes(permission);
}

export function canAccessAny(payload: JwtPayload, permissions: Permission[]): boolean {
  if (!permissions.length) return true;
  const perms = getEffectivePermissions(payload);
  return permissions.some((p) => perms.includes(p));
}

export function canAccessAll(payload: JwtPayload, permissions: Permission[]): boolean {
  const perms = getEffectivePermissions(payload);
  return permissions.every((p) => perms.includes(p));
}

export const FORBIDDEN_MESSAGE = "You do not have permission to access this resource.";
