import type { JsonRecord } from "@/types/ui";
import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { Show } from "@/models/Show";
import { Movie } from "@/models/Movie";
import { Screen } from "@/models/Screen";
import { StaffSession, StaffActivityLog } from "@/models/StaffActivity";
import { User } from "@/models/User";
import {
  getOwnerTheatreIds,
  rangePreset,
  resolveOwnerId,
} from "@/lib/theatre/isolation";
import type { JwtPayload } from "@/types";

function dayBounds(d = new Date()) {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export class OwnerDashboardService {
  async todaySummary(user: JwtPayload, theatreId?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    let theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    if (theatreId) {
      theatreIds = theatreIds.filter((id) => id.toString() === theatreId);
    }
    const { start, end } = dayBounds();

    const bookings = await Booking.find({
      theatreId: { $in: theatreIds },
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["confirmed", "cancelled"] },
    }).lean();

    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");

    const sum = (arr: typeof confirmed, fn: (b: (typeof confirmed)[0]) => number) =>
      arr.reduce((a, b) => a + fn(b), 0);

    const byPay = (method: string) =>
      sum(
        confirmed.filter((b) => (b.paymentMethod || "").toLowerCase() === method),
        (b) => b.finalAmount || 0
      );

    const shows = await Show.find({
      theatreId: { $in: theatreIds },
      isActive: true,
      status: { $ne: "cancelled" },
      startTime: { $gte: start },
      endTime: { $lte: new Date(end.getTime() + 6 * 3600000) },
    })
      .populate("movieId", "title")
      .lean();

    const activeShows = await Show.countDocuments({
      theatreId: { $in: theatreIds },
      isActive: true,
      status: "scheduled",
      startTime: { $lte: end },
      endTime: { $gte: start },
    });

    const movieIds = [
      ...new Set(shows.map((s) => s.movieId?._id?.toString() || s.movieId?.toString()).filter(Boolean)),
    ];
    const runningMovies = await Movie.find({ _id: { $in: movieIds } })
      .select("title poster")
      .lean();

    const totalSeats = shows.reduce((a, s) => a + (s.totalSeats || 0), 0);
    const available = shows.reduce((a, s) => a + (s.availableSeats || 0), 0);
    const occupancy = totalSeats
      ? Math.round(((totalSeats - available) / totalSeats) * 100)
      : 0;

    const gross = sum(confirmed, (b) => b.finalAmount || 0);
    const refunds = sum(cancelled, (b) => b.refundAmount || b.finalAmount || 0);

    // Hourly revenue
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, bookings: 0 }));
    for (const b of confirmed) {
      const h = new Date(b.createdAt).getHours();
      byHour[h].revenue += b.finalAmount || 0;
      byHour[h].bookings += 1;
    }

    const paymentMethods = [
      { method: "cash", amount: byPay("cash") },
      { method: "upi", amount: byPay("upi") },
      { method: "card", amount: byPay("card") },
      { method: "wallet", amount: byPay("wallet") },
      { method: "split", amount: byPay("split") },
    ].filter((x) => x.amount > 0);

    // Staff-wise today
    const staffMap = new Map<
      string,
      { revenue: number; tickets: number; name?: string }
    >();
    for (const b of confirmed) {
      if (!b.staffId) continue;
      const id = b.staffId.toString();
      const cur = staffMap.get(id) || { revenue: 0, tickets: 0 };
      cur.revenue += b.finalAmount || 0;
      cur.tickets += b.seats?.filter((s) => !s.cancelled).length || 0;
      staffMap.set(id, cur);
    }
    const staffUsers = await User.find({ _id: { $in: [...staffMap.keys()] } })
      .select("name role")
      .lean();
    const staffNames = new Map(staffUsers.map((u) => [u._id.toString(), u]));
    const staffWise = [...staffMap.entries()]
      .map(([id, v]) => ({
        staffId: id,
        name: staffNames.get(id)?.name || "Staff",
        role: staffNames.get(id)?.role || "—",
        ...v,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Movie / show wise
    const movieRev = new Map<string, number>();
    const showRev = new Map<string, number>();
    for (const b of confirmed) {
      const mid = b.movieId?.toString();
      const sid = b.showId?.toString();
      if (mid) movieRev.set(mid, (movieRev.get(mid) || 0) + (b.finalAmount || 0));
      if (sid) showRev.set(sid, (showRev.get(sid) || 0) + (b.finalAmount || 0));
    }
    const movies = await Movie.find({ _id: { $in: [...movieRev.keys()] } })
      .select("title")
      .lean();
    const movieNames = new Map(movies.map((m) => [m._id.toString(), m.title]));
    const movieWise = [...movieRev.entries()]
      .map(([id, revenue]) => ({ id, name: movieNames.get(id) || id, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    const showWise = [...showRev.entries()]
      .map(([id, revenue]) => ({ id, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Screen occupancy
    const screens = await Screen.find({ theatreId: { $in: theatreIds }, isActive: true }).lean();
    const screenOcc = await Promise.all(
      screens.map(async (sc) => {
        const scShows = await Show.find({
          screenId: sc._id,
          date: { $gte: start, $lte: end },
        }).lean();
        const tot = scShows.reduce((a, s) => a + s.totalSeats, 0);
        const avail = scShows.reduce((a, s) => a + s.availableSeats, 0);
        return {
          screenId: sc._id,
          name: sc.name,
          occupancy: tot ? Math.round(((tot - avail) / tot) * 100) : 0,
        };
      })
    );

    return {
      date: start.toISOString(),
      metrics: {
        todaysRevenue: gross,
        todaysBookings: confirmed.length,
        todaysTicketsSold: sum(confirmed, (b) => b.seats?.filter((s) => !s.cancelled).length || 0),
        todaysOnlineRevenue: sum(
          confirmed.filter((b) => b.channel === "online"),
          (b) => b.finalAmount || 0
        ),
        todaysOfflineRevenue: sum(
          confirmed.filter((b) => b.channel === "pos" || b.channel === "walkin"),
          (b) => b.finalAmount || 0
        ),
        todaysCashCollection: byPay("cash"),
        todaysUpiCollection: byPay("upi"),
        todaysCardCollection: byPay("card"),
        todaysRefundAmount: refunds,
        todaysOccupancy: occupancy,
        activeShows,
        runningMovies: runningMovies.length,
      },
      runningMovies,
      widgets: {
        revenueByHour: byHour.filter((h) => h.hour >= 8 && h.hour <= 23),
        revenueByPaymentMethod: paymentMethods,
        staffWiseRevenue: staffWise,
        movieWiseRevenue: movieWise.slice(0, 8),
        showWiseRevenue: showWise,
        screenOccupancy: screenOcc,
        topPerformingStaff: staffWise.slice(0, 5),
        topSellingMovie: movieWise[0] || null,
        topSellingShow: showWise[0] || null,
      },
    };
  }

  async staffTodayTable(
    user: JwtPayload,
    opts?: {
      theatreId?: string;
      counterId?: string;
      staffId?: string;
      date?: string;
      sort?: string;
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const day = opts?.date ? new Date(opts.date) : new Date();
    const { start, end } = dayBounds(day);

    const sessionFilter: Record<string, unknown> = {
      ownerId,
      loginAt: { $gte: start, $lte: end },
    };
    if (opts?.theatreId) sessionFilter.theatreId = opts.theatreId;
    if (opts?.counterId) sessionFilter.counterId = opts.counterId;
    if (opts?.staffId) sessionFilter.userId = opts.staffId;

    const sessions = await StaffSession.find(sessionFilter)
      .populate("userId", "name role email")
      .populate("theatreId", "name")
      .lean();

    // Also include staff who booked without session
    const bookingMatch: Record<string, unknown> = {
      ownerId,
      createdAt: { $gte: start, $lte: end },
      staffId: { $exists: true, $ne: null },
    };
    if (opts?.theatreId) bookingMatch.theatreId = opts.theatreId;
    if (opts?.counterId) bookingMatch.counterId = opts.counterId;
    if (opts?.staffId) bookingMatch.staffId = opts.staffId;

    const bookings = await Booking.find(bookingMatch).lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byStaff = new Map<string, any>();

    for (const s of sessions) {
      const uid = (s.userId as JsonRecord)?._id?.toString() || s.userId?.toString();
      if (!uid) continue;
      byStaff.set(uid, {
        staffId: uid,
        name: (s.userId as JsonRecord)?.name || "Staff",
        role: (s.userId as JsonRecord)?.role || "—",
        counterName: s.counterId || "—",
        theatreName: (s.theatreId as JsonRecord)?.name || "—",
        theatreId: (s.theatreId as JsonRecord)?._id || s.theatreId,
        loginTime: s.loginAt,
        logoutTime: s.logoutAt || null,
        ticketsBooked: s.ticketsBooked || 0,
        ticketsCancelled: s.ticketsCancelled || 0,
        refundAmount: s.refundAmount || 0,
        revenueGenerated: s.revenueGenerated || 0,
        lastActivity: s.lastActivityAt,
        status: s.isActive ? "Online" : "Offline",
        sessionId: s._id,
      });
    }

    for (const b of bookings) {
      const uid = b.staffId?.toString();
      if (!uid) continue;
      if (!byStaff.has(uid)) {
        const u = await User.findById(uid).select("name role").lean();
        byStaff.set(uid, {
          staffId: uid,
          name: u?.name || "Staff",
          role: u?.role || "—",
          counterName: b.counterId || "—",
          theatreName: "—",
          loginTime: null,
          logoutTime: null,
          ticketsBooked: 0,
          ticketsCancelled: 0,
          refundAmount: 0,
          revenueGenerated: 0,
          lastActivity: b.createdAt,
          status: "Offline",
        });
      }
      const row = byStaff.get(uid);
      if (b.status === "confirmed") {
        // prefer session counters if already set from session
        if (!row._fromBookings) {
          row._booked = 0;
          row._revenue = 0;
          row._fromBookings = true;
        }
      }
    }

    // Enrich with booking aggregates for accuracy
    const rows = await Promise.all(
      [...byStaff.values()].map(async (row) => {
        const conf = bookings.filter(
          (b) => b.staffId?.toString() === row.staffId && b.status === "confirmed"
        );
        const canc = bookings.filter(
          (b) => b.staffId?.toString() === row.staffId && b.status === "cancelled"
        );
        const ticketsBooked = conf.reduce(
          (a, b) => a + (b.seats?.filter((s) => !s.cancelled).length || 0),
          0
        );
        const revenueGenerated = conf.reduce((a, b) => a + (b.finalAmount || 0), 0);
        const ticketsCancelled = canc.reduce(
          (a, b) => a + (b.seats?.length || 0),
          0
        );
        const refundAmount = canc.reduce(
          (a, b) => a + (b.refundAmount || b.finalAmount || 0),
          0
        );
        const avgBookingTime =
          conf.length > 1
            ? Math.round(
                (new Date(conf[0].createdAt).getTime() -
                  new Date(conf[conf.length - 1].createdAt).getTime()) /
                  conf.length /
                  1000
              )
            : conf.length
              ? 90
              : 0;

        return {
          staffId: row.staffId,
          name: row.name,
          role: row.role,
          counterName: row.counterName,
          theatreName: row.theatreName,
          loginTime: row.loginTime,
          logoutTime: row.logoutTime,
          ticketsBooked: Math.max(row.ticketsBooked || 0, ticketsBooked),
          ticketsCancelled: Math.max(row.ticketsCancelled || 0, ticketsCancelled),
          refundAmount: Math.max(row.refundAmount || 0, refundAmount),
          revenueGenerated: Math.max(row.revenueGenerated || 0, revenueGenerated),
          averageBookingTimeSec: Math.abs(avgBookingTime),
          lastActivity: row.lastActivity,
          status: row.status,
        };
      })
    );

    const sort = opts?.sort || "revenue";
    rows.sort((a, b) => {
      if (sort === "tickets") return b.ticketsBooked - a.ticketsBooked;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.revenueGenerated - a.revenueGenerated;
    });

    return rows;
  }

  async activityLogs(
    user: JwtPayload,
    opts?: { from?: string; to?: string; theatreId?: string; action?: string; limit?: number }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const { start, end } = opts?.from || opts?.to
      ? (() => {
          const endD = opts?.to ? new Date(opts.to) : new Date();
          endD.setHours(23, 59, 59, 999);
          const startD = opts?.from
            ? new Date(opts.from)
            : new Date(endD.getTime() - 7 * 86400000);
          startD.setHours(0, 0, 0, 0);
          return { start: startD, end: endD };
        })()
      : rangePreset("week");

    const filter: Record<string, unknown> = {
      ownerId,
      createdAt: { $gte: start, $lte: end },
    };
    if (opts?.theatreId) filter.theatreId = opts.theatreId;
    if (opts?.action) filter.action = opts.action;

    return StaffActivityLog.find(filter)
      .populate("userId", "name role email")
      .populate("theatreId", "name")
      .sort({ createdAt: -1 })
      .limit(Math.min(opts?.limit || 200, 500))
      .lean();
  }
}

export const ownerDashboardService = new OwnerDashboardService();
