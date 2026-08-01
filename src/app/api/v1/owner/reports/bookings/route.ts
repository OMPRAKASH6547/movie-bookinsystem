import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/constants/roles";
import { financeService } from "@/services/finance.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const url = new URL(req.url);
      const format = (url.searchParams.get("format") || "json") as "json" | "csv";
      const data = await financeService.bookingReport(req.user, {
        theatreId: url.searchParams.get("theatreId") || undefined,
        movieId: url.searchParams.get("movieId") || undefined,
        showId: url.searchParams.get("showId") || undefined,
        staffId: url.searchParams.get("staffId") || undefined,
        paymentMethod: url.searchParams.get("paymentMethod") || undefined,
        from: url.searchParams.get("from") || undefined,
        to: url.searchParams.get("to") || undefined,
        format,
      });

      if (format === "csv" && "csv" in data) {
        return new NextResponse(data.csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="bookings-report.csv"`,
          },
        });
      }
      return successResponse(data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  { permission: PERMISSIONS.VIEW_REPORTS }
);
