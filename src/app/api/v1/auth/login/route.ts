import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS } from "@/constants";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { ...RATE_LIMITS.AUTH, keyPrefix: "rl:login" });
  if (limited) return limited;

  try {
    await connectDB();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })));
    }

    const result = await authService.login(
      parsed.data,
      req.headers.get("x-forwarded-for") || undefined
    );

    const maxAge = parsed.data.rememberMe ? 7 * 24 * 60 * 60 : 15 * 60;
    const response = successResponse(result, "Login successful");
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    response.cookies.set("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Login failed",
      401
    );
  }
}
