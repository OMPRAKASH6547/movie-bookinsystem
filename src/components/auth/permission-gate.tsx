"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  canAccessTheatrePath,
  defaultTheatreLanding,
} from "@/lib/theatre/nav";
import { ROLES } from "@/constants/roles";

/** Client-side route guard for /theatre/* — hides unauthorized pages via redirect */
export function TheatrePermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) return;

    const allowed = canAccessTheatrePath(pathname, user.permissions, user.role);
    if (!allowed) {
      const landing = defaultTheatreLanding(user.permissions, user.role);
      if (landing !== pathname) router.replace(landing);
    }
  }, [pathname, user, router]);

  if (user && user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.ADMIN) {
    if (!canAccessTheatrePath(pathname, user.permissions, user.role)) {
      return (
        <div className="flex items-center justify-center min-h-[40vh] text-sm text-muted-foreground">
          Redirecting to your workspace…
        </div>
      );
    }
  }

  return <>{children}</>;
}
