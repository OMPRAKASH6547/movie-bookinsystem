import { NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { successResponse, errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { SEAT_TYPES } from "@/constants";

/** Demo seat map when DB/show not seeded */
function demoSeatMap(showId: string) {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seats = [];
  for (const row of rows) {
    for (let n = 1; n <= 12; n++) {
      const type =
        row <= "B"
          ? SEAT_TYPES.RECLINER
          : row <= "D"
            ? SEAT_TYPES.PREMIUM
            : SEAT_TYPES.REGULAR;
      const price = type === SEAT_TYPES.RECLINER ? 450 : type === SEAT_TYPES.PREMIUM ? 320 : 220;
      seats.push({
        id: `${row}${n}`,
        row,
        number: n,
        type,
        price,
        isAvailable: true,
        isAisle: n === 3 || n === 9,
        status: Math.random() > 0.85 ? "booked" : "available",
        lockedBy: null,
      });
    }
  }
  return {
    showId,
    layout: { rows: 8, columns: 12 },
    seats,
    availableSeats: seats.filter((s) => s.status === "available").length,
    pricing: [
      { seatType: SEAT_TYPES.REGULAR, price: 220 },
      { seatType: SEAT_TYPES.PREMIUM, price: 320 },
      { seatType: SEAT_TYPES.RECLINER, price: 450 },
    ],
    demo: true,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ showId: string }> }
) {
  try {
    const { showId } = await params;
    try {
      await connectDB();
      const result = await bookingService.getSeatAvailability(showId);
      return successResponse(result);
    } catch {
      return successResponse(demoSeatMap(showId), "Demo seat map");
    }
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch seats",
      500
    );
  }
}
