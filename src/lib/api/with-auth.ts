import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  canAccess,
  canAccessAny,
  canAccessAll,
  FORBIDDEN_MESSAGE,
} from "@/lib/auth/rbac";
import { errorResponse } from "@/utils/api-response";
import { logger } from "@/lib/logger";
import type { JwtPayload } from "@/types";
import type { Permission, Role } from "@/constants/roles";
import { connectDB } from "@/lib/db/mongodb";

export type AuthenticatedRequest = NextRequest & {
  user: JwtPayload;
};

type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  req: AuthenticatedRequest,
  context: RouteContext
) => Promise<NextResponse | Response>;

interface AuthOptions {
  /** If set, role must be one of these (optional when permission is enough) */
  roles?: Role[];
  /** Single required permission */
  permission?: Permission;
  /** User needs ANY of these */
  permissionsAny?: Permission[];
  /** User needs ALL of these */
  permissionsAll?: Permission[];
  optional?: boolean;
}

function forbidden() {
  return errorResponse(FORBIDDEN_MESSAGE, 403);
}

export function withAuth(handler: Handler, options: AuthOptions = {}) {
  return async (
    req: NextRequest,
    context: RouteContext
  ): Promise<NextResponse | Response> => {
    try {
      try {
        await connectDB();
      } catch {
        /* Mongo optional for JWT-authenticated demo flows */
      }

      const authHeader = req.headers.get("authorization");
      const cookieToken = req.cookies.get("access_token")?.value;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : cookieToken;

      if (!token) {
        if (options.optional) {
          return handler(req as AuthenticatedRequest, context);
        }
        return errorResponse("Authentication required", 401);
      }

      let payload: JwtPayload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return errorResponse("Invalid or expired token", 401);
      }

      const needsPermCheck =
        options.permission ||
        options.permissionsAny?.length ||
        options.permissionsAll?.length;

      // Prefer permission checks; roles alone are a secondary gate
      if (needsPermCheck) {
        if (options.permission && !canAccess(payload, options.permission)) {
          return forbidden();
        }
        if (
          options.permissionsAny?.length &&
          !canAccessAny(payload, options.permissionsAny)
        ) {
          return forbidden();
        }
        if (
          options.permissionsAll?.length &&
          !canAccessAll(payload, options.permissionsAll)
        ) {
          return forbidden();
        }
      } else if (options.roles && !options.roles.includes(payload.role)) {
        return forbidden();
      }

      // If both roles + permissions specified, also enforce role allow-list
      // (except when permission already granted and user is staff under owner scope)
      if (
        options.roles?.length &&
        needsPermCheck &&
        !options.roles.includes(payload.role)
      ) {
        // Allow if they passed permission check — permission is source of truth
        // unless roles is meant as hard allow-list for platform-only routes
        const platformOnly = options.roles.every((r) =>
          ["super_admin", "admin"].includes(r)
        );
        if (platformOnly) return forbidden();
      }

      const authedReq = req as AuthenticatedRequest;
      authedReq.user = payload;

      return handler(authedReq, context);
    } catch (error) {
      logger.error("Auth middleware error", {
        error: error instanceof Error ? error.message : "Unknown",
      });
      return errorResponse("Internal server error", 500);
    }
  };
}
