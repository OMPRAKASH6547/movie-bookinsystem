import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { collectionService } from "@/services/collection.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const sp = new URL(req.url).searchParams;
      const view = sp.get("view") || "dashboard";
      const opts = {
        from: sp.get("from") || undefined,
        to: sp.get("to") || undefined,
        theatreId: sp.get("theatreId") || undefined,
        screenId: sp.get("screenId") || undefined,
        staffId: sp.get("staffId") || undefined,
        counterId: sp.get("counterId") || undefined,
        shift: sp.get("shift") || undefined,
        format: (sp.get("format") as "json" | "csv") || "json",
      };

      if (view === "sales") {
        const data = await collectionService.counterSalesReport(req.user, opts);
        if (opts.format === "csv" && "csv" in data && data.csv) {
          const body = collectionService.toExcelCsv(data.csv);
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="counter-sales.csv"`,
            },
          });
        }
        return successResponse(data);
      }

      if (view === "staff") {
        const staff = await collectionService.staffDirectory(req.user);
        return successResponse(staff);
      }

      const dashboard = await collectionService.collectionDashboard(req.user, opts);
      if (opts.format === "csv") {
        const header =
          "Staff,Counter,Tickets,Revenue,Discounts,Coupons,Refunds,Cash,Card,UPI,Wallet";
        const lines = dashboard.byCounter.map((c) =>
          [
            JSON.stringify(c.staffName),
            c.counterId,
            c.ticketsSold,
            c.revenue,
            c.discounts,
            c.couponsUsed,
            c.refunds,
            c.byPayment.cash || 0,
            c.byPayment.card || 0,
            c.byPayment.upi || 0,
            c.byPayment.wallet || 0,
          ].join(",")
        );
        const csv = collectionService.toExcelCsv([header, ...lines].join("\n"));
        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="collection-report.csv"`,
          },
        });
      }
      return successResponse(dashboard);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 500);
    }
  },
  {
    permissionsAny: [
      PERMISSIONS.MANAGE_FINANCE,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_STAFF_PERFORMANCE,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
    ],
  }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (body.action === "handover") {
        if (!body.theatreId || !body.counterId) {
          return errorResponse("theatreId and counterId required", 422);
        }
        const doc = await collectionService.submitHandover(req.user, {
          theatreId: body.theatreId,
          counterId: body.counterId,
          shift: body.shift,
          openingCash: Number(body.openingCash || 0),
          closingCash: Number(body.closingCash || 0),
          note: body.note,
          handedOverTo: body.handedOverTo,
        });
        return successResponse(doc, "Cash handover submitted", 201);
      }
      if (body.action === "status" && body.id && body.status) {
        const doc = await collectionService.updateHandoverStatus(
          req.user,
          body.id,
          body.status,
          body.note
        );
        return successResponse(doc, "Settlement updated");
      }
      return errorResponse("Unknown action", 422);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  {
    permissionsAny: [
      PERMISSIONS.MANAGE_FINANCE,
      PERMISSIONS.POS_BOOK,
      PERMISSIONS.VIEW_OWNER_DASHBOARD,
    ],
  }
);
