import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { otpLoginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS } from "@/constants";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { ...RATE_LIMITS.OTP, keyPrefix: "rl:otp" });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone) return errorResponse("Phone is required", 422);

    if (!otp) {
      const result = await authService.sendOTP(phone);
      return successResponse(result, "OTP sent");
    }

    await connectDB();
    const parsed = otpLoginSchema.safeParse(body);
    if (!parsed.success) return errorResponse("Invalid OTP payload", 422);

    const result = await authService.verifyOTP(phone, otp);
    const response = successResponse(result, "OTP verified");
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
      error instanceof Error ? error.message : "OTP failed",
      400
    );
  }
}
