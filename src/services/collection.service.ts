import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { CashClosing } from "@/models/Expense";
import { Show } from "@/models/Show";
import { User } from "@/models/User";
import { UserTheaterMapping } from "@/models/Rbac";
import {
  getOwnerTheatreIds,
  parseDateRange,
  resolveOwnerId,
} from "@/lib/theatre/isolation";
import type { JwtPayload } from "@/types";
import { AuditLog } from "@/models/AuditLog";

function shiftFromHour(h: number): string {
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

export class CollectionService {
  private async baseFilter(
    user: JwtPayload,
    opts: {
      from?: string;
      to?: string;
      theatreId?: string;
      screenId?: string;
      staffId?: string;
      counterId?: string;
      shift?: string;
      channel?: string;
    }
  ) {
    const ownerId = resolveOwnerId(user);
    const theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    const { start, end } = parseDateRange(opts.from, opts.to);

    const filter: Record<string, unknown> = {
      ownerId,
      theatreId: { $in: theatreIds },
      createdAt: { $gte: start, $lte: end },
      channel: { $in: ["pos", "walkin"] },
    };
    if (opts.theatreId) filter.theatreId = opts.theatreId;
    if (opts.staffId) filter.staffId = opts.staffId;
    if (opts.counterId) filter.counterId = opts.counterId;
    if (opts.channel) filter.channel = opts.channel;
    if (opts.screenId) {
      const shows = await Show.find({ screenId: opts.screenId }).select("_id").lean();
      filter.showId = { $in: shows.map((s) => s._id) };
    }
    return { filter, start, end, ownerId };
  }

  /** Ticket-level counter sales rows */
  async counterSalesReport(
    user: JwtPayload,
    opts: {
      from?: string;
      to?: string;
      theatreId?: string;
      screenId?: string;
      staffId?: string;
      counterId?: string;
      shift?: string;
      format?: "json" | "csv";
    }
  ) {
    await connectDB();
    const { filter } = await this.baseFilter(user, opts);

    let rows = await Booking.find(filter)
      .populate("staffId", "name email")
      .populate("theatreId", "name")
      .populate("movieId", "title")
      .populate("showId", "startTime screenId")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    if (opts.shift && opts.shift !== "full_day") {
      rows = rows.filter((b) => {
        const shift = b.shift || shiftFromHour(new Date(b.createdAt).getHours());
        return shift === opts.shift;
      });
    }

    const mapped = rows.map((b) => {
      const staff = b.staffId as { name?: string; email?: string } | null;
      const seats = (b.seats || []).filter((s) => !s.cancelled);
      return {
        bookingId: b._id,
        bookingNumber: b.bookingNumber,
        staffId: staff && typeof staff === "object" && "_id" in (b.staffId as object)
          ? String((b.staffId as { _id: unknown })._id)
          : b.staffId?.toString?.(),
        staffName: staff?.name || "Unknown",
        counterId: b.counterId || "—",
        theatre: (b.theatreId as { name?: string })?.name || "",
        movie: (b.movieId as { title?: string })?.title || "",
        ticketsSold: seats.length,
        totalRevenue: b.status === "cancelled" ? 0 : b.finalAmount,
        grossAmount: b.totalAmount,
        discount: b.discount || 0,
        couponCode: b.couponCode || "",
        paymentMethod: b.paymentMethod || "",
        channel: b.channel,
        status: b.status,
        shift: b.shift || shiftFromHour(new Date(b.createdAt).getHours()),
        dateTime: b.createdAt,
        cancelledAt: b.cancelledAt || null,
        cancelReason: b.cancelReason || "",
        refundAmount: b.refundAmount || 0,
      };
    });

    if (opts.format === "csv") {
      const header = [
        "Booking",
        "Staff",
        "Counter",
        "Theatre",
        "Movie",
        "Tickets",
        "Gross",
        "Discount",
        "Coupon",
        "Revenue",
        "Payment",
        "Status",
        "Shift",
        "DateTime",
        "CancelledAt",
        "Refund",
        "CancelReason",
      ].join(",");
      const lines = mapped.map((r) =>
        [
          r.bookingNumber,
          JSON.stringify(r.staffName),
          r.counterId,
          JSON.stringify(r.theatre),
          JSON.stringify(r.movie),
          r.ticketsSold,
          r.grossAmount,
          r.discount,
          r.couponCode,
          r.totalRevenue,
          r.paymentMethod,
          r.status,
          r.shift,
          new Date(r.dateTime).toISOString(),
          r.cancelledAt ? new Date(r.cancelledAt).toISOString() : "",
          r.refundAmount,
          JSON.stringify(r.cancelReason || ""),
        ].join(",")
      );
      return { csv: [header, ...lines].join("\n"), rows: mapped };
    }

    return { rows: mapped };
  }

  /** Aggregated collection by counter / staff */
  async collectionDashboard(
    user: JwtPayload,
    opts: {
      from?: string;
      to?: string;
      theatreId?: string;
      screenId?: string;
      staffId?: string;
      counterId?: string;
      shift?: string;
    }
  ) {
    await connectDB();
    const { start, end, ownerId } = await this.baseFilter(user, opts);
    const sales = await this.counterSalesReport(user, opts);
    const rows = "rows" in sales ? sales.rows : [];

    type Agg = {
      key: string;
      staffId?: string;
      staffName: string;
      counterId: string;
      ticketsSold: number;
      revenue: number;
      discounts: number;
      couponsUsed: number;
      refunds: number;
      cancelledTickets: number;
      byPayment: Record<string, number>;
    };

    const map = new Map<string, Agg>();
    for (const r of rows) {
      const key = `${r.staffId || "na"}:${r.counterId}`;
      const cur = map.get(key) || {
        key,
        staffId: r.staffId,
        staffName: r.staffName,
        counterId: r.counterId,
        ticketsSold: 0,
        revenue: 0,
        discounts: 0,
        couponsUsed: 0,
        refunds: 0,
        cancelledTickets: 0,
        byPayment: {},
      };
      if (r.status === "cancelled") {
        cur.cancelledTickets += r.ticketsSold;
        cur.refunds += r.refundAmount;
      } else {
        cur.ticketsSold += r.ticketsSold;
        cur.revenue += r.totalRevenue;
        cur.discounts += r.discount;
        if (r.couponCode) cur.couponsUsed += 1;
        const pm = r.paymentMethod || "other";
        cur.byPayment[pm] = (cur.byPayment[pm] || 0) + r.totalRevenue;
      }
      map.set(key, cur);
    }

    const byCounter = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);

    const totals = byCounter.reduce(
      (acc, c) => {
        acc.ticketsSold += c.ticketsSold;
        acc.revenue += c.revenue;
        acc.discounts += c.discounts;
        acc.refunds += c.refunds;
        acc.couponsUsed += c.couponsUsed;
        return acc;
      },
      { ticketsSold: 0, revenue: 0, discounts: 0, refunds: 0, couponsUsed: 0 }
    );

    const pending = await CashClosing.find({
      ownerId,
      handoverStatus: { $in: ["pending", "submitted", "disputed"] },
      date: { $gte: start, $lte: end },
      ...(opts.theatreId ? { theatreId: opts.theatreId } : {}),
    })
      .populate("staffId", "name")
      .populate("theatreId", "name")
      .sort({ date: -1 })
      .lean();

    // Compare: previous equal-length period
    const span = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - span);
    const prevEnd = new Date(start.getTime() - 1);
    const prev = await this.counterSalesReport(user, {
      ...opts,
      from: prevStart.toISOString(),
      to: prevEnd.toISOString(),
    });
    const prevRows = "rows" in prev ? prev.rows : [];
    const prevRevenue = prevRows
      .filter((r) => r.status !== "cancelled")
      .reduce((a, r) => a + r.totalRevenue, 0);

    return {
      range: { from: start, to: end },
      totals,
      byCounter,
      comparison: {
        previousRevenue: prevRevenue,
        currentRevenue: totals.revenue,
        changePct:
          prevRevenue > 0
            ? Math.round(((totals.revenue - prevRevenue) / prevRevenue) * 1000) / 10
            : null,
      },
      pendingSettlements: pending.map((p) => ({
        id: p._id,
        date: p.date,
        shift: p.shift,
        counterId: p.counterId,
        staffName: (p.staffId as { name?: string })?.name || "",
        theatre: (p.theatreId as { name?: string })?.name || "",
        expectedCash: p.expectedCash,
        closingCash: p.closingCash,
        variance: p.variance,
        handoverStatus: p.handoverStatus,
        cashSales: p.cashSales,
        cardSales: p.cardSales,
        upiSales: p.upiSales,
      })),
    };
  }

  async submitHandover(
    user: JwtPayload,
    data: {
      theatreId: string;
      counterId: string;
      shift?: string;
      openingCash: number;
      closingCash: number;
      note?: string;
      handedOverTo?: string;
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      ownerId,
      theatreId: data.theatreId,
      staffId: user.sub,
      counterId: data.counterId,
      channel: { $in: ["pos", "walkin"] },
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    let cashSales = 0,
      cardSales = 0,
      upiSales = 0,
      walletSales = 0,
      onlineSales = 0,
      refunds = 0,
      discounts = 0,
      couponsUsed = 0,
      ticketsSold = 0;

    for (const b of bookings) {
      if (b.status === "cancelled") {
        refunds += b.refundAmount || 0;
        continue;
      }
      ticketsSold += (b.seats || []).filter((s) => !s.cancelled).length;
      discounts += b.discount || 0;
      if (b.couponCode) couponsUsed += 1;
      const amt = b.finalAmount;
      switch (b.paymentMethod) {
        case "cash":
          cashSales += amt;
          break;
        case "card":
          cardSales += amt;
          break;
        case "upi":
          upiSales += amt;
          break;
        case "wallet":
          walletSales += amt;
          break;
        default:
          onlineSales += amt;
      }
    }

    const expectedCash = data.openingCash + cashSales - refunds;
    const variance = data.closingCash - expectedCash;

    const doc = await CashClosing.create({
      ownerId,
      theatreId: data.theatreId,
      counterId: data.counterId,
      staffId: user.sub,
      date: new Date(),
      shift: data.shift || shiftFromHour(new Date().getHours()),
      openingCash: data.openingCash,
      closingCash: data.closingCash,
      expectedCash,
      variance,
      cashSales,
      cardSales,
      upiSales,
      walletSales,
      onlineSales,
      refunds,
      discounts,
      couponsUsed,
      ticketsSold,
      handoverStatus: "submitted",
      handedOverTo: data.handedOverTo,
      handedOverAt: new Date(),
      note: data.note,
    });

    await AuditLog.create({
      userId: user.sub,
      action: "CASH_HANDOVER_SUBMITTED",
      resource: "CashClosing",
      resourceId: doc._id.toString(),
      details: { counterId: data.counterId, expectedCash, variance },
    }).catch(() => null);

    return doc;
  }

  async updateHandoverStatus(
    user: JwtPayload,
    id: string,
    status: "accepted" | "disputed" | "settled",
    note?: string
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const doc = await CashClosing.findOne({ _id: id, ownerId });
    if (!doc) throw new Error("Settlement not found");
    doc.handoverStatus = status;
    if (status === "accepted" || status === "settled") {
      doc.acceptedBy = user.sub as never;
      doc.acceptedAt = new Date();
    }
    if (note) doc.note = note;
    await doc.save();
    await AuditLog.create({
      userId: user.sub,
      action: `CASH_HANDOVER_${status.toUpperCase()}`,
      resource: "CashClosing",
      resourceId: id,
    }).catch(() => null);
    return doc;
  }

  toExcelCsv(csv: string) {
    // Excel-friendly UTF-8 BOM CSV
    return `\uFEFF${csv}`;
  }

  async staffDirectory(user: JwtPayload) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const mappings = await UserTheaterMapping.find({ ownerId, isActive: true })
      .select("userId roleKey")
      .lean();
    const ids = mappings.map((m) => m.userId);
    ids.push(ownerId as never);
    return User.find({ _id: { $in: ids } }).select("name email role").lean();
  }
}

export const collectionService = new CollectionService();
