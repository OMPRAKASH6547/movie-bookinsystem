import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token } = await req.json();
    if (!token) return errorResponse("Token required", 422);

    const user = await User.findOne({ emailVerifyToken: token });
    if (!user) return errorResponse("Invalid verification token", 400);

    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();

    return successResponse({ verified: true }, "Email verified");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Verification failed",
      400
    );
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return errorResponse("Token required", 422);

  try {
    await connectDB();
    const user = await User.findOne({ emailVerifyToken: token });
    if (!user) return errorResponse("Invalid verification token", 400);
    user.isEmailVerified = true;
    user.emailVerifyToken = undefined;
    await user.save();
    return successResponse({ verified: true }, "Email verified");
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Verification failed",
      400
    );
  }
}
