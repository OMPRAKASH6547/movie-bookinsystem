import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { rateLimit } from "@/lib/api/rate-limit";
import { RATE_LIMITS } from "@/constants";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { ...RATE_LIMITS.AUTH, keyPrefix: "rl:reset" });
  if (limited) return limited;

  try {
    await connectDB();
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse("Validation failed", 422);

    const result = await authService.resetPassword(parsed.data.token, parsed.data.password);
    return successResponse(result, result.message);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Reset failed",
      400
    );
  }
}
