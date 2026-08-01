import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { Expense, CashClosing } from "@/models/Expense";
import { Theatre } from "@/models/Theatre";
import { getOwnerTheatreIds, parseDateRange, resolveOwnerId } from "@/lib/theatre/isolation";
import type { JwtPayload } from "@/types";
import { ROLES } from "@/constants/roles";

export class FinanceService {
  async gstReport(
    user: JwtPayload,
    opts: { from?: string; to?: string; theatreId?: string }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const { start, end } = parseDateRange(opts.from, opts.to);
    let theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    if (opts.theatreId) {
      theatreIds = theatreIds.filter((id) => id.toString() === opts.theatreId);
    }

    const bookings = await Booking.find({
      theatreId: { $in: theatreIds },
      status: "confirmed",
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const taxable = bookings.reduce((a, b) => a + (b.totalAmount - (b.discount || 0)), 0);
    const tax = bookings.reduce((a, b) => a + (b.tax || 0), 0);
    const cgst = Math.round(tax / 2);
    const sgst = tax - cgst;

    return {
      start,
      end,
      invoiceCount: bookings.length,
      taxableValue: taxable,
      cgst,
      sgst,
      igst: 0,
      totalTax: tax,
      totalInclusive: taxable + tax,
      rows: bookings.slice(0, 500).map((b) => ({
        bookingNumber: b.bookingNumber,
        date: b.createdAt,
        taxable: b.totalAmount - (b.discount || 0),
        tax: b.tax,
        total: b.finalAmount,
        theatreId: b.theatreId,
      })),
    };
  }

  async settlementReport(user: JwtPayload, opts: { from?: string; to?: string }) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const { start, end } = parseDateRange(opts.from, opts.to);
    const theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    const theatres = await Theatre.find({ _id: { $in: theatreIds } }).lean();

    const bookings = await Booking.find({
      theatreId: { $in: theatreIds },
      status: "confirmed",
      createdAt: { $gte: start, $lte: end },
    }).lean();

    return theatres.map((t) => {
      const rows = bookings.filter((b) => b.theatreId.toString() === t._id.toString());
      const gross = rows.reduce((a, b) => a + b.finalAmount, 0);
      const commission = Math.round((gross * (t.commissionRate || 10)) / 100);
      const online = rows
        .filter((b) => b.channel === "online")
        .reduce((a, b) => a + b.finalAmount, 0);
      return {
        theatreId: t._id,
        theatreName: t.name,
        gross,
        online,
        offline: gross - online,
        commissionRate: t.commissionRate,
        platformCommission: commission,
        netSettlement: online - commission,
        bookings: rows.length,
      };
    });
  }

  async listExpenses(user: JwtPayload, theatreId?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const filter: Record<string, unknown> = { ownerId };
    if (theatreId) filter.theatreId = theatreId;
    return Expense.find(filter).sort({ date: -1 }).limit(200).lean();
  }

  async addExpense(
    user: JwtPayload,
    data: {
      theatreId: string;
      category: string;
      amount: number;
      note?: string;
      date?: string;
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatre = await Theatre.findById(data.theatreId);
    if (!theatre || (user.role !== ROLES.SUPER_ADMIN && theatre.ownerId.toString() !== ownerId)) {
      throw new Error("Access denied");
    }
    return Expense.create({
      ownerId,
      theatreId: data.theatreId,
      category: data.category,
      amount: data.amount,
      note: data.note,
      date: data.date ? new Date(data.date) : new Date(),
      createdBy: user.sub,
    });
  }

  async cashClosing(
    user: JwtPayload,
    data: {
      theatreId: string;
      counterId: string;
      openingCash: number;
      closingCash: number;
      note?: string;
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatre = await Theatre.findById(data.theatreId);
    if (!theatre || (user.role !== ROLES.SUPER_ADMIN && theatre.ownerId.toString() !== ownerId)) {
      throw new Error("Access denied");
    }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      theatreId: data.theatreId,
      counterId: data.counterId,
      status: "confirmed",
      channel: { $in: ["pos", "walkin"] },
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }).lean();

    const by = (m: string) =>
      bookings
        .filter((b) => (b.paymentMethod || "").toLowerCase() === m)
        .reduce((a, b) => a + b.finalAmount, 0);

    const cashSales = by("cash");
    const cardSales = by("card");
    const upiSales = by("upi");
    const walletSales = by("wallet");
    const refunds = await Booking.aggregate([
      {
        $match: {
          theatreId: theatre._id,
          counterId: data.counterId,
          status: "cancelled",
          createdAt: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$refundAmount" } } },
    ]);
    const refundTotal = refunds[0]?.total || 0;
    const expectedCash = data.openingCash + cashSales - refundTotal;
    const variance = data.closingCash - expectedCash;

    return CashClosing.create({
      ownerId,
      theatreId: data.theatreId,
      counterId: data.counterId,
      staffId: user.sub,
      date: new Date(),
      openingCash: data.openingCash,
      closingCash: data.closingCash,
      expectedCash,
      variance,
      cashSales,
      cardSales,
      upiSales,
      walletSales,
      refunds: refundTotal,
      note: data.note,
    });
  }

  async listCashClosings(user: JwtPayload, theatreId?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const filter: Record<string, unknown> = { ownerId };
    if (theatreId) filter.theatreId = theatreId;
    return CashClosing.find(filter)
      .populate("staffId", "name")
      .populate("theatreId", "name")
      .sort({ date: -1 })
      .limit(50)
      .lean();
  }

  async bookingReport(
    user: JwtPayload,
    opts: {
      theatreId?: string;
      movieId?: string;
      showId?: string;
      staffId?: string;
      paymentMethod?: string;
      from?: string;
      to?: string;
      format?: "json" | "csv";
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    const { start, end } = parseDateRange(opts.from, opts.to);

    const filter: Record<string, unknown> = {
      theatreId: { $in: theatreIds },
      createdAt: { $gte: start, $lte: end },
    };
    if (opts.theatreId) filter.theatreId = opts.theatreId;
    if (opts.movieId) filter.movieId = opts.movieId;
    if (opts.showId) filter.showId = opts.showId;
    if (opts.staffId) filter.staffId = opts.staffId;
    if (opts.paymentMethod) filter.paymentMethod = opts.paymentMethod;

    const rows = await Booking.find(filter)
      .populate("movieId", "title")
      .populate("theatreId", "name")
      .populate("staffId", "name")
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();

    if (opts.format === "csv") {
      const header =
        "Booking,Date,Theatre,Movie,Channel,Payment,Seats,Amount,Tax,Status,Staff";
      const lines = rows.map((b) =>
        [
          b.bookingNumber,
          new Date(b.createdAt).toISOString(),
          (b.theatreId as { name?: string })?.name || "",
          (b.movieId as { title?: string })?.title || "",
          b.channel,
          b.paymentMethod || "",
          b.seats?.length || 0,
          b.finalAmount,
          b.tax,
          b.status,
          (b.staffId as { name?: string })?.name || "",
        ].join(",")
      );
      return { csv: [header, ...lines].join("\n"), count: rows.length };
    }

    return { rows, count: rows.length, start, end };
  }
}

export const financeService = new FinanceService();
