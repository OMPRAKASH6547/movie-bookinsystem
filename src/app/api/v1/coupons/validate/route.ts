import { NextRequest } from "next/server";
import { promotionService } from "@/services/promotion.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      amount,
      theatreId,
      movieId,
      screenId,
      showId,
      seatCategories,
      paymentMethod,
      showDateTime,
      ownerId,
      autoApply,
    } = body;

    if (!amount || amount <= 0) return errorResponse("Valid amount required", 422);

    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("access_token")?.value;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cookieToken;
    if (token) {
      try {
        userId = verifyAccessToken(token).sub;
      } catch {
        /* optional auth */
      }
    }

    await connectDB();
    const result = await promotionService.resolve({
      amount: Number(amount),
      couponCode: code || undefined,
      userId,
      theatreId,
      movieId,
      screenId,
      showId,
      seatCategories,
      paymentMethod,
      showDateTime: showDateTime ? new Date(showDateTime) : undefined,
      ownerId,
      channel: "online",
      // if no code and autoApply requested, still resolve auto offers
      allowStacking: !!body.allowStacking,
    });

    // When only validating a blank code for auto offers
    if (!code && !autoApply && result.discount === 0) {
      return errorResponse("Code and amount required", 422);
    }

    return successResponse(
      {
        code: result.couponCode,
        discount: result.discount,
        finalAmount: result.finalAmount,
        description: result.labels.join(" · ") || "Promotion applied",
        labels: result.labels,
        offerIds: result.offerIds,
        breakdown: {
          couponDiscount: result.couponDiscount,
          offerDiscount: result.offerDiscount,
          manualDiscount: result.manualDiscount,
        },
      },
      result.discount > 0 ? "Promotion applied" : "No discount"
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Coupon validation failed",
      400
    );
  }
}
