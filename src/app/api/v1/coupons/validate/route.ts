import { NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { code, amount } = await req.json();
    if (!code || !amount) return errorResponse("Code and amount required", 422);

    try {
      await connectDB();
      const result = await bookingService.applyCoupon(code, amount);
      return successResponse(result, "Coupon applied");
    } catch {
      // Demo coupons
      const demos: Record<string, number> = {
        CINEPASS50: 0.5,
        BOGOWED: 0.25,
        WALLET150: 150,
        STUDENT20: 0.2,
      };
      const upper = String(code).toUpperCase();
      if (!(upper in demos)) return errorResponse("Invalid coupon", 400);

      const val = demos[upper];
      const discount = val < 1 ? Math.round(amount * val) : Math.min(val, amount);
      return successResponse({
        code: upper,
        discount,
        finalAmount: amount - discount,
        description: "Demo coupon",
        demo: true,
      });
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Coupon validation failed",
      400
    );
  }
}
