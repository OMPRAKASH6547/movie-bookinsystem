import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { registerSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS } from "@/constants";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { ...RATE_LIMITS.AUTH, keyPrefix: "rl:register" });
  if (limited) return limited;

  try {
    await connectDB();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422, parsed.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })));
    }

    const result = await authService.register(
      parsed.data,
      req.headers.get("x-forwarded-for") || undefined
    );

    const response = successResponse(result, "Registration successful", 201);
    response.cookies.set("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
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
      error instanceof Error ? error.message : "Registration failed",
      400
    );
  }
}
