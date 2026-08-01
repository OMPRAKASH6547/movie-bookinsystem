import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { successResponse, errorResponse } from "@/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const refreshToken =
      body.refreshToken || req.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return errorResponse("Refresh token required", 401);
    }

    const tokens = await authService.refresh(refreshToken);
    const response = successResponse(tokens, "Token refreshed");

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
      error instanceof Error ? error.message : "Refresh failed",
      401
    );
  }
}
