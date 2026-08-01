import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { successResponse, errorResponse } from "@/utils/api-response";
import { PERMISSIONS } from "@/constants/roles";
import { financeService } from "@/services/finance.service";

export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "gst";
    const theatreId = url.searchParams.get("theatreId") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    if (type === "settlement") {
      return successResponse(await financeService.settlementReport(req.user, { from, to }));
    }
    if (type === "expenses") {
      return successResponse(await financeService.listExpenses(req.user, theatreId));
    }
    if (type === "cash-closing") {
      return successResponse(await financeService.listCashClosings(req.user, theatreId));
    }
    return successResponse(await financeService.gstReport(req.user, { from, to, theatreId }));
  },
  { permission: PERMISSIONS.MANAGE_FINANCE }
);

export const POST = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      if (body.type === "expense") {
        if (!body.theatreId || !body.category || body.amount == null) {
          return errorResponse("theatreId, category, amount required", 422);
        }
        const expense = await financeService.addExpense(req.user, body);
        return successResponse(expense, "Expense added", 201);
      }
      if (body.type === "cash-closing") {
        if (
          !body.theatreId ||
          !body.counterId ||
          body.openingCash == null ||
          body.closingCash == null
        ) {
          return errorResponse(
            "theatreId, counterId, openingCash, closingCash required",
            422
          );
        }
        const closing = await financeService.cashClosing(req.user, body);
        return successResponse(closing, "Cash closing saved", 201);
      }
      return errorResponse("Unknown type", 422);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : "Failed", 400);
    }
  },
  {
    permissionsAny: [PERMISSIONS.MANAGE_FINANCE, PERMISSIONS.MANAGE_EXPENSES],
  }
);
