import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { authService } from "@/services/auth.service";
import { guestLoginSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { createAuthTokens } from "@/lib/auth/jwt";
import { ROLES, ROLE_PERMISSIONS } from "@/constants/roles";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = guestLoginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422);
    }

    try {
      await connectDB();
      const result = await authService.guestLogin(parsed.data);
      const response = successResponse(result, "Guest session created");
      response.cookies.set("access_token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60,
        path: "/",
      });
      return response;
    } catch {
      /* offline guest JWT */
    }

    const id = `guest_${nanoid(12)}`;
    const tokens = await createAuthTokens({
      id,
      email: parsed.data.email.toLowerCase(),
      role: ROLES.GUEST,
    });

    const user = {
      id,
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: ROLES.GUEST,
      isEmailVerified: false,
      permissions: ROLE_PERMISSIONS[ROLES.GUEST],
    };

    const response = successResponse({ user, ...tokens }, "Guest session created (offline)");
    response.cookies.set("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    response.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Guest login failed",
      400
    );
  }
}
