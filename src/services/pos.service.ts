import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { Show } from "@/models/Show";
import { Theatre } from "@/models/Theatre";
import { Movie } from "@/models/Movie";
import { User } from "@/models/User";
import { StaffSession, StaffActivityLog } from "@/models/StaffActivity";
import { TicketScan } from "@/models/TicketScan";
import { generateBookingNumber } from "@/utils/format";
import { resolveOwnerId } from "@/lib/theatre/isolation";
import { promotionService } from "@/services/promotion.service";
import type { JwtPayload } from "@/types";
import { ROLES } from "@/constants/roles";

function shiftFromHour(h: number) {
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

function parseUA(ua?: string | null) {
  const s = ua || "";
  const device = /Mobile|Android|iPhone/i.test(s) ? "Mobile" : "Desktop";
  let browser = "Unknown";
  if (/Chrome/i.test(s)) browser = "Chrome";
  else if (/Firefox/i.test(s)) browser = "Firefox";
  else if (/Safari/i.test(s)) browser = "Safari";
  else if (/Edg/i.test(s)) browser = "Edge";
  return { device, browser };
}

export class PosService {
  async ensureSession(
    user: JwtPayload,
    opts?: { theatreId?: string; counterId?: string; ip?: string; ua?: string }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    let session = await StaffSession.findOne({
      userId: user.sub,
      isActive: true,
    }).sort({ loginAt: -1 });

    if (!session) {
      const { device, browser } = parseUA(opts?.ua);
      session = await StaffSession.create({
        userId: user.sub,
        ownerId,
        theatreId: opts?.theatreId,
        counterId: opts?.counterId || "COUNTER-1",
        ipAddress: opts?.ip,
        userAgent: opts?.ua,
        device,
        browser,
      });
    }
    return session;
  }

  async logoutSession(user: JwtPayload) {
    await connectDB();
    await StaffSession.updateMany(
      { userId: user.sub, isActive: true },
      { isActive: false, logoutAt: new Date() }
    );
    return { ok: true };
  }

  async logActivity(
    user: JwtPayload,
    action: string,
    resource: string,
    resourceId?: string,
    meta?: Record<string, unknown>,
    ip?: string
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const session = await StaffSession.findOne({ userId: user.sub, isActive: true });
    if (session) {
      session.lastActivityAt = new Date();
      await session.save();
    }
    await StaffActivityLog.create({
      userId: user.sub,
      ownerId,
      theatreId: session?.theatreId,
      sessionId: session?._id,
      action,
      resource,
      resourceId,
      meta,
      ipAddress: ip,
    });
  }

  async createPosBooking(
    user: JwtPayload,
    data: {
      showId: string;
      seats: { seatId: string; row: string; number: number; type: string; price: number }[];
      paymentMethod: "cash" | "card" | "upi" | "wallet" | "split";
      splitPayments?: { method: string; amount: number }[];
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerId?: string;
      counterId?: string;
      discount?: number;
      couponCode?: string;
      shift?: string;
      allowStacking?: boolean;
    },
    meta?: { ip?: string; ua?: string }
  ) {
    await connectDB();
    const show = await Show.findById(data.showId);
    if (!show || !show.isActive || show.status === "cancelled") {
      throw new Error("Show not available");
    }

    const theatre = await Theatre.findById(show.theatreId);
    if (!theatre) throw new Error("Theatre not found");
    const ownerId = resolveOwnerId(user);
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      theatre.ownerId.toString() !== ownerId
    ) {
      throw new Error("Access denied");
    }

    const taken = data.seats.filter((s) => show.bookedSeats.includes(s.seatId));
    if (taken.length) throw new Error(`Seats already booked: ${taken.map((s) => s.seatId).join(", ")}`);

    let userId = data.customerId;
    if (!userId && data.customerPhone) {
      let customer = await User.findOne({ phone: data.customerPhone });
      if (!customer && data.customerEmail) {
        customer = await User.findOne({ email: data.customerEmail.toLowerCase() });
      }
      if (!customer) {
        customer = await User.create({
          name: data.customerName || "Walk-in Customer",
          email:
            data.customerEmail ||
            `walkin_${nanoid(8)}@cinepass.local`.toLowerCase(),
          phone: data.customerPhone,
          role: ROLES.CUSTOMER,
          provider: "guest",
          referralCode: nanoid(8).toUpperCase(),
          isEmailVerified: false,
        });
      }
      userId = customer._id.toString();
    }
    if (!userId) {
      // anonymous walk-in — attach to staff user as placeholder then store customer fields
      userId = user.sub;
    }

    const totalAmount = data.seats.reduce((a, s) => a + s.price, 0);
    const promo = await promotionService.resolve({
      amount: totalAmount,
      userId,
      ownerId: theatre.ownerId?.toString(),
      theatreId: show.theatreId.toString(),
      movieId: show.movieId.toString(),
      screenId: show.screenId?.toString(),
      showId: show._id.toString(),
      seatCategories: data.seats.map((s) => s.type),
      paymentMethod: data.paymentMethod === "split" ? "cash" : data.paymentMethod,
      showDateTime: show.startTime ? new Date(show.startTime) : new Date(),
      channel: "pos",
      couponCode: data.couponCode,
      manualDiscount: data.discount,
      allowStacking: data.allowStacking,
    });
    const discount = promo.discount;
    const taxable = Math.max(0, totalAmount - discount);
    const tax = Math.round(taxable * 0.18);
    const finalAmount = taxable + tax;
    const bookingNumber = generateBookingNumber();
    const barcode = bookingNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 16);
    const qrPayload = JSON.stringify({
      bn: bookingNumber,
      seats: data.seats.map((s) => s.seatId),
      showId: show._id.toString(),
    });
    const qrCode = await QRCode.toDataURL(qrPayload, { margin: 1, width: 256 });
    const channel = data.customerPhone || data.customerName ? "walkin" : "pos";
    const now = new Date();

    const booking = await Booking.create({
      bookingNumber,
      userId,
      showId: show._id,
      movieId: show.movieId,
      theatreId: show.theatreId,
      ownerId: theatre.ownerId,
      screenId: show.screenId,
      seats: data.seats,
      totalAmount,
      discount,
      tax,
      finalAmount,
      couponCode: promo.couponCode,
      offerIds: promo.offerIds,
      discountBreakdown: {
        couponDiscount: promo.couponDiscount,
        offerDiscount: promo.offerDiscount,
        manualDiscount: promo.manualDiscount,
        labels: promo.labels,
      },
      shift: data.shift || shiftFromHour(now.getHours()),
      status: "confirmed",
      channel,
      paymentMethod: data.paymentMethod,
      splitPayments: data.splitPayments,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      staffId: user.sub,
      counterId: data.counterId || "COUNTER-1",
      qrCode,
      barcode,
      printCount: 0,
    });

    if (promo.discount > 0) {
      await promotionService.recordRedemption({
        ownerId: theatre.ownerId?.toString(),
        couponId: promo.couponId,
        offerIds: promo.offerIds,
        code: promo.couponCode,
        bookingId: booking._id.toString(),
        userId,
        staffId: user.sub,
        channel,
        discountAmount: promo.discount,
        bookingAmount: totalAmount,
        theatreId: show.theatreId.toString(),
        actorId: user.sub,
      });
    }

    show.bookedSeats.push(...data.seats.map((s) => s.seatId));
    show.availableSeats = Math.max(0, show.availableSeats - data.seats.length);
    await show.save();

    const session = await this.ensureSession(user, {
      theatreId: show.theatreId.toString(),
      counterId: data.counterId,
      ip: meta?.ip,
      ua: meta?.ua,
    });
    session.ticketsBooked += data.seats.length;
    session.revenueGenerated += finalAmount;
    session.lastActivityAt = new Date();
    await session.save();

    await this.logActivity(
      user,
      "POS_BOOK",
      "Booking",
      booking._id.toString(),
      { bookingNumber, amount: finalAmount, method: data.paymentMethod },
      meta?.ip
    );

    const movie = await Movie.findById(show.movieId).select("title poster").lean();
    return {
      ...booking.toObject(),
      movie,
      theatreName: theatre.name,
      showTime: show.startTime,
    };
  }

  async cancelBooking(
    user: JwtPayload,
    bookingId: string,
    opts?: { seatIds?: string[]; reason?: string; refund?: boolean }
  ) {
    await connectDB();
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    const ownerId = resolveOwnerId(user);
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      booking.ownerId?.toString() !== ownerId
    ) {
      throw new Error("Access denied");
    }

    let refundAmount = 0;
    if (opts?.seatIds?.length) {
      // partial cancel
      booking.seats = booking.seats.map((s) => {
        if (opts.seatIds!.includes(s.seatId) && !s.cancelled) {
          s.cancelled = true;
          refundAmount += s.price;
          return s;
        }
        return s;
      });
      const activeSeats = booking.seats.filter((s) => !s.cancelled);
      if (activeSeats.length === 0) {
        booking.status = "cancelled";
        booking.cancelledAt = new Date();
      }
      booking.refundAmount = (booking.refundAmount || 0) + refundAmount;
      booking.finalAmount = Math.max(0, booking.finalAmount - refundAmount);
    } else {
      refundAmount = booking.finalAmount;
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancelReason = opts?.reason || "POS cancellation";
      booking.refundAmount = refundAmount;
      booking.seats = booking.seats.map((s) => {
        s.cancelled = true;
        return s;
      });
    }

    await booking.save();

    const show = await Show.findById(booking.showId);
    if (show) {
      const release = opts?.seatIds?.length
        ? opts.seatIds
        : booking.seats.map((s) => s.seatId);
      show.bookedSeats = show.bookedSeats.filter((id) => !release.includes(id));
      show.availableSeats = Math.min(show.totalSeats, show.availableSeats + release.length);
      await show.save();
    }

    const session = await StaffSession.findOne({ userId: user.sub, isActive: true });
    if (session) {
      session.ticketsCancelled += opts?.seatIds?.length || booking.seats.length;
      session.refundAmount += refundAmount;
      session.lastActivityAt = new Date();
      await session.save();
    }

    await this.logActivity(user, "POS_CANCEL", "Booking", bookingId, {
      refundAmount,
      partial: Boolean(opts?.seatIds?.length),
    });

    return { booking, refundAmount };
  }

  async reprint(user: JwtPayload, bookingId: string) {
    await connectDB();
    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    const ownerId = resolveOwnerId(user);
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      booking.ownerId?.toString() !== ownerId
    ) {
      throw new Error("Access denied");
    }
    booking.printCount = (booking.printCount || 0) + 1;
    if (!booking.qrCode) {
      booking.qrCode = await QRCode.toDataURL(
        JSON.stringify({ bn: booking.bookingNumber }),
        { margin: 1, width: 256 }
      );
    }
    if (!booking.barcode) {
      booking.barcode = booking.bookingNumber.replace(/[^A-Z0-9]/gi, "").slice(0, 16);
    }
    await booking.save();
    await this.logActivity(user, "POS_REPRINT", "Booking", bookingId);
    return booking;
  }

  async thermalPayload(bookingId: string, width: 58 | 80 = 80) {
    await connectDB();
    const booking = await Booking.findById(bookingId).lean();
    if (!booking) throw new Error("Booking not found");
    const [movie, theatre, show] = await Promise.all([
      Movie.findById(booking.movieId).select("title").lean(),
      Theatre.findById(booking.theatreId).select("name address gstNumber").lean(),
      Show.findById(booking.showId).select("startTime").lean(),
    ]);

    const chars = width === 58 ? 32 : 48;
    const line = (ch = "-") => ch.repeat(chars);
    const center = (t: string) => {
      const pad = Math.max(0, Math.floor((chars - t.length) / 2));
      return " ".repeat(pad) + t;
    };

    const lines = [
      center(theatre?.name || "CinePass"),
      center("TAX INVOICE / TICKET"),
      line(),
      `Booking: ${booking.bookingNumber}`,
      `Movie: ${movie?.title || "—"}`,
      `Show: ${show?.startTime ? new Date(show.startTime).toLocaleString("en-IN") : "—"}`,
      `Seats: ${booking.seats
        .filter((s) => !s.cancelled)
        .map((s) => s.seatId)
        .join(", ")}`,
      line(),
      `Amount: ₹${booking.finalAmount}`,
      `Tax (GST): ₹${booking.tax}`,
      `Pay: ${(booking.paymentMethod || "cash").toUpperCase()}`,
      booking.customerName ? `Guest: ${booking.customerName}` : "",
      theatre?.gstNumber ? `GSTIN: ${theatre.gstNumber}` : "",
      line(),
      center(`Barcode: ${booking.barcode || booking.bookingNumber}`),
      center("Thank you! Enjoy the show"),
      line("="),
    ].filter(Boolean);

    return {
      width,
      text: lines.join("\n"),
      qrCode: booking.qrCode,
      barcode: booking.barcode,
      booking,
      movie,
      theatre,
      show,
    };
  }

  async verifyTicket(
    user: JwtPayload,
    code: string,
    opts?: { theatreId?: string; exit?: boolean; deviceInfo?: string }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    let booking = await Booking.findOne({
      $or: [{ bookingNumber: code }, { barcode: code }],
    });

    if (!booking && code.startsWith("{")) {
      try {
        const parsed = JSON.parse(code);
        if (parsed.bn) booking = await Booking.findOne({ bookingNumber: parsed.bn });
      } catch {
        /* ignore */
      }
    }

    // Also try QR data URL content won't work — expect raw booking number
    if (!booking) {
      await TicketScan.create({
        bookingNumber: code,
        theatreId: opts?.theatreId,
        scannedBy: user.sub,
        ownerId,
        result: "invalid",
        deviceInfo: opts?.deviceInfo,
      });
      return { result: "invalid" as const, message: "Ticket not found" };
    }

    if (
      user.role !== ROLES.SUPER_ADMIN &&
      booking.ownerId?.toString() !== ownerId
    ) {
      return { result: "invalid" as const, message: "Wrong theatre network" };
    }

    if (booking.status === "cancelled") {
      await TicketScan.create({
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        theatreId: booking.theatreId,
        showId: booking.showId,
        scannedBy: user.sub,
        ownerId,
        result: "cancelled",
        deviceInfo: opts?.deviceInfo,
      });
      return { result: "cancelled" as const, booking, message: "Ticket cancelled" };
    }

    const prior = await TicketScan.findOne({
      bookingId: booking._id,
      result: "valid",
      exitAt: { $exists: false },
    });

    if (opts?.exit) {
      if (prior) {
        prior.exitAt = new Date();
        await prior.save();
      }
      return { result: "valid" as const, booking, message: "Exit recorded", exit: true };
    }

    if (booking.checkedInAt || prior) {
      await TicketScan.create({
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        theatreId: booking.theatreId,
        showId: booking.showId,
        scannedBy: user.sub,
        ownerId,
        result: "duplicate",
        entryAt: booking.checkedInAt || prior?.entryAt,
        deviceInfo: opts?.deviceInfo,
      });
      return {
        result: "duplicate" as const,
        booking,
        message: "Already scanned",
        entryAt: booking.checkedInAt || prior?.entryAt,
      };
    }

    const entryAt = new Date();
    booking.checkedInAt = entryAt;
    await booking.save();
    await TicketScan.create({
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      theatreId: booking.theatreId,
      showId: booking.showId,
      scannedBy: user.sub,
      ownerId,
      result: "valid",
      entryAt,
      deviceInfo: opts?.deviceInfo,
    });

    await this.logActivity(user, "VERIFY_TICKET", "Booking", booking._id.toString());
    return { result: "valid" as const, booking, message: "Entry allowed", entryAt };
  }

  async listSessions(user: JwtPayload, opts?: { from?: string; to?: string }) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const filter: Record<string, unknown> = { ownerId };
    if (opts?.from || opts?.to) {
      filter.loginAt = {};
      if (opts.from) (filter.loginAt as Record<string, Date>).$gte = new Date(opts.from);
      if (opts.to) (filter.loginAt as Record<string, Date>).$lte = new Date(opts.to);
    }
    return StaffSession.find(filter)
      .populate("userId", "name email role")
      .populate("theatreId", "name")
      .sort({ loginAt: -1 })
      .limit(100)
      .lean();
  }

  async staffPerformance(
    user: JwtPayload,
    opts?: { theatreId?: string; from?: string; to?: string; role?: string; staffId?: string }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const end = opts?.to ? new Date(opts.to) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = opts?.from ? new Date(opts.from) : new Date(end.getTime() - 30 * 86400000);
    start.setHours(0, 0, 0, 0);

    const staffFilter: Record<string, unknown> = {
      ownerId,
      role: { $in: ["manager", "counter_staff", "ticket_checker", "accountant", "marketing", "employee"] },
    };
    if (opts?.role) staffFilter.role = opts.role;
    if (opts?.staffId) staffFilter._id = opts.staffId;

    const staff = await User.find(staffFilter).select("name email role theatreIds").lean();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(1);

    const rows = await Promise.all(
      staff.map(async (s) => {
        const bookingMatch: Record<string, unknown> = {
          staffId: s._id,
          status: "confirmed",
          createdAt: { $gte: start, $lte: end },
        };
        if (opts?.theatreId) bookingMatch.theatreId = opts.theatreId;

        const [all, today, week, month, cancels, sessions] = await Promise.all([
          Booking.find({ ...bookingMatch }).lean(),
          Booking.countDocuments({
            staffId: s._id,
            status: "confirmed",
            createdAt: { $gte: todayStart },
          }),
          Booking.countDocuments({
            staffId: s._id,
            status: "confirmed",
            createdAt: { $gte: weekStart },
          }),
          Booking.countDocuments({
            staffId: s._id,
            status: "confirmed",
            createdAt: { $gte: monthStart },
          }),
          Booking.countDocuments({
            staffId: s._id,
            status: "cancelled",
            createdAt: { $gte: start, $lte: end },
          }),
          StaffSession.find({
            userId: s._id,
            loginAt: { $gte: start, $lte: end },
          }).lean(),
        ]);

        const revenue = all.reduce((a, b) => a + (b.finalAmount || 0), 0);
        const tickets = all.reduce((a, b) => a + (b.seats?.length || 0), 0);
        const refunds = sessions.reduce((a, x) => a + (x.refundAmount || 0), 0);
        const loginHours = sessions.reduce((a, x) => {
          const endAt = x.logoutAt ? new Date(x.logoutAt).getTime() : Date.now();
          return a + (endAt - new Date(x.loginAt).getTime()) / 3600000;
        }, 0);

        return {
          staffId: s._id,
          name: s.name,
          role: s.role,
          todayTickets: today,
          weeklyTickets: week,
          monthlyTickets: month,
          tickets,
          revenueGenerated: revenue,
          refundCount: sessions.reduce((a, x) => a + (x.ticketsCancelled > 0 ? 1 : 0), 0),
          cancellationCount: cancels,
          averageBookingTime: all.length ? Math.round(120 / Math.max(1, all.length / 8)) : 0,
          loginHours: Math.round(loginHours * 10) / 10,
          refundAmount: refunds,
        };
      })
    );

    rows.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }
}

export const posService = new PosService();
