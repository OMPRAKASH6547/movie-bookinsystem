import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { canAccess } from "@/lib/auth/rbac";
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
) => Promise<NextResponse>;

interface AuthOptions {
  roles?: Role[];
  permission?: Permission;
  optional?: boolean;
}

export function withAuth(handler: Handler, options: AuthOptions = {}) {
  return async (req: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      await connectDB();

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

      if (options.roles && !options.roles.includes(payload.role)) {
        return errorResponse("Insufficient role privileges", 403);
      }

      if (options.permission && !canAccess(payload, options.permission)) {
        return errorResponse("Permission denied", 403);
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
