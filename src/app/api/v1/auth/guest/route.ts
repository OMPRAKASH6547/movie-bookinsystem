import { NextRequest } from "next/server";
import { authService } from "@/services/auth.service";
import { guestLoginSchema } from "@/lib/validators/auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = guestLoginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Validation failed", 422);
    }

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
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Guest login failed",
      400
    );
  }
}
