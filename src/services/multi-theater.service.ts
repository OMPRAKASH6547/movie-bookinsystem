import { nanoid } from "nanoid";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Theatre } from "@/models/Theatre";
import { Screen } from "@/models/Screen";
import { Show } from "@/models/Show";
import { Movie } from "@/models/Movie";
import { User } from "@/models/User";
import { Booking } from "@/models/Booking";
import { AuditLog } from "@/models/AuditLog";
import { hashPassword } from "@/lib/auth/password";
import { ROLES, STAFF_ROLES, ROLE_PERMISSIONS, type Role, type Permission } from "@/constants/roles";
import { slugify } from "@/utils/format";
import {
  getOwnerTheatreIds,
  parseDateRange,
  rangePreset,
  resolveOwnerId,
} from "@/lib/theatre/isolation";
import type { JwtPayload } from "@/types";

function oid(id: string) {
  return new mongoose.Types.ObjectId(id);
}

export class MultiTheaterService {
  /* ── Super Admin: owners ── */
  async listOwners(opts?: { status?: string; page?: number; limit?: number }) {
    await connectDB();
    const page = opts?.page || 1;
    const limit = Math.min(opts?.limit || 20, 100);
    const filter: Record<string, unknown> = { role: ROLES.THEATRE_OWNER };
    if (opts?.status) filter.ownerStatus = opts.status;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const withCounts = await Promise.all(
      items.map(async (o) => {
        const theatres = await Theatre.countDocuments({ ownerId: o._id });
        return { ...o, theatreCount: theatres };
      })
    );

    return { items: withCounts, total, page, limit };
  }

  async onboardOwner(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    subscriptionPlan?: string;
    approved?: boolean;
  }) {
    await connectDB();
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error("Email already registered");

    const password = await hashPassword(data.password || "Password1");
    const owner = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password,
      role: ROLES.THEATRE_OWNER,
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
      ownerStatus: data.approved === false ? "pending" : "approved",
      subscriptionPlan: data.subscriptionPlan || "Starter",
    });

    return owner;
  }

  async updateOwnerStatus(
    ownerId: string,
    status: "pending" | "approved" | "rejected" | "suspended",
    note?: string
  ) {
    await connectDB();
    const owner = await User.findOneAndUpdate(
      { _id: ownerId, role: ROLES.THEATRE_OWNER },
      { ownerStatus: status, isActive: status === "approved" || status === "pending" },
      { new: true }
    ).select("-password");
    if (!owner) throw new Error("Owner not found");

    if (status === "suspended") {
      await Theatre.updateMany({ ownerId }, { status: "suspended", isActive: false });
    } else if (status === "approved") {
      await Theatre.updateMany(
        { ownerId, status: "suspended" },
        { status: "active", isActive: true }
      );
    }

    await AuditLog.create({
      userId: ownerId,
      action: `OWNER_${status.toUpperCase()}`,
      resource: "User",
      resourceId: ownerId,
      meta: { note },
    });

    return owner;
  }

  /* ── Super Admin: all theatres ── */
  async listAllTheatres(opts?: {
    status?: string;
    city?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }) {
    await connectDB();
    const page = opts?.page || 1;
    const limit = Math.min(opts?.limit || 20, 100);
    const filter: Record<string, unknown> = {};
    if (opts?.status) filter.status = opts.status;
    if (opts?.city) filter.city = new RegExp(opts.city, "i");
    if (opts?.ownerId) filter.ownerId = opts.ownerId;

    const [items, total] = await Promise.all([
      Theatre.find(filter)
        .populate("ownerId", "name email phone subscriptionPlan ownerStatus")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Theatre.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  async setTheatreStatus(
    theatreId: string,
    status: "pending" | "approved" | "rejected" | "suspended" | "active",
    adminId: string,
    note?: string
  ) {
    await connectDB();
    const updates: Record<string, unknown> = {
      status,
      isActive: status === "approved" || status === "active",
      approvalNote: note,
    };
    if (status === "approved" || status === "active") {
      updates.approvedAt = new Date();
      updates.approvedBy = adminId;
    }
    const theatre = await Theatre.findByIdAndUpdate(theatreId, updates, { new: true });
    if (!theatre) throw new Error("Theatre not found");
    return theatre;
  }

  async setCommission(theatreId: string, rate: number) {
    await connectDB();
    const theatre = await Theatre.findByIdAndUpdate(
      theatreId,
      { commissionRate: rate },
      { new: true }
    );
    if (!theatre) throw new Error("Theatre not found");
    return theatre;
  }

  async platformRevenue(preset?: string, from?: string, to?: string) {
    await connectDB();
    const { start, end } =
      from || to ? parseDateRange(from, to) : rangePreset(preset || "month");

    const bookings = await Booking.find({
      status: { $in: ["confirmed", "cancelled"] },
      createdAt: { $gte: start, $lte: end },
    })
      .select("finalAmount tax refundAmount theatreId channel paymentMethod status ownerId")
      .lean();

    const theatres = await Theatre.find().select("name commissionRate ownerId").lean();
    const theatreMap = new Map(theatres.map((t) => [t._id.toString(), t]));

    let gross = 0;
    let refunds = 0;
    let tax = 0;
    let commission = 0;
    const byTheatre: Record<string, { name: string; revenue: number; tickets: number }> = {};

    for (const b of bookings) {
      if (b.status === "cancelled") {
        refunds += b.refundAmount || 0;
        continue;
      }
      gross += b.finalAmount || 0;
      tax += b.tax || 0;
      const t = theatreMap.get(b.theatreId.toString());
      const rate = t?.commissionRate ?? 10;
      commission += ((b.finalAmount || 0) * rate) / 100;
      const key = b.theatreId.toString();
      if (!byTheatre[key]) {
        byTheatre[key] = { name: t?.name || "Theatre", revenue: 0, tickets: 0 };
      }
      byTheatre[key].revenue += b.finalAmount || 0;
      byTheatre[key].tickets += 1;
    }

    return {
      start,
      end,
      grossRevenue: gross,
      netRevenue: gross - refunds,
      taxCollected: tax,
      refundAmount: refunds,
      platformCommission: Math.round(commission),
      totalBookings: bookings.filter((b) => b.status === "confirmed").length,
      theatreBreakdown: Object.entries(byTheatre).map(([id, v]) => ({ id, ...v })),
      owners: await User.countDocuments({ role: ROLES.THEATRE_OWNER }),
      theatres: theatres.length,
      activeTheatres: theatres.filter((t) => (t as { isActive?: boolean }).isActive !== false)
        .length,
    };
  }

  /* ── Owner: theatres CRUD ── */
  async listOwnerTheatres(user: JwtPayload, includePending = true) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const filter: Record<string, unknown> = { ownerId };
    if (!includePending && user.role !== ROLES.SUPER_ADMIN) {
      filter.status = { $in: ["approved", "active"] };
    }
    return Theatre.find(filter).sort({ createdAt: -1 }).lean();
  }

  async createTheatre(
    user: JwtPayload,
    data: {
      name: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      lat?: number;
      lng?: number;
      mapUrl?: string;
      amenities?: string[];
      contactPhone?: string;
      contactEmail?: string;
      gstNumber?: string;
      gstLegalName?: string;
      capacity?: number;
    }
  ) {
    await connectDB();
    if (user.role !== ROLES.THEATRE_OWNER && user.role !== ROLES.SUPER_ADMIN) {
      throw new Error("Only theatre owners can create theatres");
    }
    const owner = await User.findById(user.sub);
    if (owner?.ownerStatus === "suspended" || owner?.ownerStatus === "rejected") {
      throw new Error("Owner account is not approved");
    }

    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let i = 1;
    while (await Theatre.exists({ slug })) {
      slug = `${baseSlug}-${i++}`;
    }

    const theatre = await Theatre.create({
      name: data.name,
      slug,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      location: {
        type: "Point",
        coordinates: [data.lng ?? 72.8777, data.lat ?? 19.076],
      },
      mapUrl:
        data.mapUrl ||
        `https://www.google.com/maps?q=${data.lat ?? 19.076},${data.lng ?? 72.8777}`,
      amenities: data.amenities || [],
      ownerId: user.sub,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      gstNumber: data.gstNumber,
      gstLegalName: data.gstLegalName,
      capacity: data.capacity || 0,
      status: "pending",
      isActive: false,
    });

    await User.findByIdAndUpdate(user.sub, { $addToSet: { theatreIds: theatre._id } });
    return theatre;
  }

  async updateTheatre(user: JwtPayload, theatreId: string, data: Record<string, unknown>) {
    await connectDB();
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) throw new Error("Theatre not found");
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      theatre.ownerId.toString() !== resolveOwnerId(user)
    ) {
      throw new Error("Access denied");
    }

    const allowed = [
      "name",
      "address",
      "city",
      "state",
      "pincode",
      "mapUrl",
      "amenities",
      "contactPhone",
      "contactEmail",
      "gstNumber",
      "gstLegalName",
      "capacity",
      "images",
      "settings",
    ];
    for (const key of allowed) {
      if (data[key] !== undefined) (theatre as unknown as Record<string, unknown>)[key] = data[key];
    }
    if (data.lat != null && data.lng != null) {
      theatre.location = {
        type: "Point",
        coordinates: [Number(data.lng), Number(data.lat)],
      };
    }
    await theatre.save();
    return theatre;
  }

  async deleteTheatre(user: JwtPayload, theatreId: string) {
    await connectDB();
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) throw new Error("Theatre not found");
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      theatre.ownerId.toString() !== resolveOwnerId(user)
    ) {
      throw new Error("Access denied");
    }
    await Show.updateMany({ theatreId }, { isActive: false, status: "cancelled" });
    await Screen.updateMany({ theatreId }, { isActive: false });
    await Theatre.findByIdAndDelete(theatreId);
    await User.findByIdAndUpdate(theatre.ownerId, { $pull: { theatreIds: theatre._id } });
    return { deleted: true };
  }

  /* ── Screens ── */
  async listScreens(user: JwtPayload, theatreId?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatreIds = theatreId
      ? [oid(theatreId)]
      : await getOwnerTheatreIds(ownerId, { includePending: true });

    if (theatreId) {
      const t = await Theatre.findById(theatreId);
      if (!t || (user.role !== ROLES.SUPER_ADMIN && t.ownerId.toString() !== ownerId)) {
        throw new Error("Access denied");
      }
    }

    return Screen.find({ theatreId: { $in: theatreIds } })
      .populate("theatreId", "name city")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createScreen(
    user: JwtPayload,
    data: {
      theatreId: string;
      name: string;
      capacity?: number;
      screenType?: string;
      rows?: number;
      columns?: number;
      seatLayout?: unknown;
    }
  ) {
    await connectDB();
    const theatre = await Theatre.findById(data.theatreId);
    if (!theatre) throw new Error("Theatre not found");
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      theatre.ownerId.toString() !== resolveOwnerId(user)
    ) {
      throw new Error("Access denied");
    }

    const rows = data.rows || 8;
    const cols = data.columns || 12;
    const seatLayout =
      data.seatLayout ||
      (() => {
        const seats = [];
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, rows).split("");
        for (const row of letters) {
          for (let n = 1; n <= cols; n++) {
            const type = row <= "B" ? "vip" : row <= "D" ? "premium" : "regular";
            seats.push({
              id: `${row}${n}`,
              row,
              number: n,
              type,
              price: type === "vip" ? 500 : type === "premium" ? 350 : 220,
              isAvailable: true,
              status: "available",
              isAisle: n === 3 || n === 9,
            });
          }
        }
        return { rows, columns: cols, seats };
      })();

    const screen = await Screen.create({
      theatreId: data.theatreId,
      name: data.name,
      capacity: data.capacity || rows * cols,
      screenType: data.screenType || "2D",
      seatLayout,
    });

    await Theatre.findByIdAndUpdate(data.theatreId, {
      $inc: { screenCount: 1, capacity: screen.capacity },
    });

    return screen;
  }

  async updateScreen(user: JwtPayload, screenId: string, data: Record<string, unknown>) {
    await connectDB();
    const screen = await Screen.findById(screenId);
    if (!screen) throw new Error("Screen not found");
    const theatre = await Theatre.findById(screen.theatreId);
    if (
      !theatre ||
      (user.role !== ROLES.SUPER_ADMIN &&
        theatre.ownerId.toString() !== resolveOwnerId(user))
    ) {
      throw new Error("Access denied");
    }

    if (data.name) screen.name = String(data.name);
    if (data.screenType) screen.screenType = data.screenType as typeof screen.screenType;
    if (data.isActive !== undefined) screen.isActive = Boolean(data.isActive);
    if (data.seatLayout) {
      screen.seatLayout = data.seatLayout as typeof screen.seatLayout;
      screen.capacity = screen.seatLayout.seats?.filter((s) => s.status !== "blocked").length ||
        screen.seatLayout.seats?.length ||
        screen.capacity;
    }
    if (data.seatUpdates && Array.isArray(data.seatUpdates)) {
      const map = new Map(
        (data.seatUpdates as { id: string; type?: string; price?: number; status?: string }[]).map(
          (s) => [s.id, s]
        )
      );
      screen.seatLayout.seats = screen.seatLayout.seats.map((seat) => {
        const u = map.get(seat.id);
        if (!u) return seat;
        return {
          ...seat,
          type: u.type || seat.type,
          price: u.price ?? seat.price,
          status: (u.status as typeof seat.status) || seat.status,
          isAvailable: u.status === "blocked" || u.status === "maintenance" ? false : seat.isAvailable,
        };
      });
    }
    await screen.save();
    return screen;
  }

  /* ── Movies (owner catalog) ── */
  async listMovies(user: JwtPayload) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    return Movie.find({
      $or: [{ ownerId: null }, { ownerId: { $exists: false } }, { ownerId }],
    })
      .sort({ releaseDate: -1 })
      .lean();
  }

  async createMovie(
    user: JwtPayload,
    data: {
      title: string;
      description?: string;
      poster?: string;
      backdrop?: string;
      trailerUrl?: string;
      duration: number;
      languages?: string[];
      genres?: string[];
      rating?: number;
      certification?: string;
      releaseDate?: string;
      status?: string;
    }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let i = 1;
    while (await Movie.exists({ slug })) slug = `${baseSlug}-${i++}`;

    return Movie.create({
      title: data.title,
      slug,
      description: data.description || data.title,
      poster: data.poster || "/images/poster-placeholder.jpg",
      backdrop: data.backdrop || data.poster || "/images/backdrop-placeholder.jpg",
      trailerUrl: data.trailerUrl,
      duration: data.duration,
      languages: data.languages || ["Hindi"],
      genres: data.genres || ["Drama"],
      rating: data.rating || 0,
      certification: data.certification || "UA",
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : new Date(),
      status: data.status || "now_showing",
      ownerId,
      cast: [],
      crew: [],
      tags: [],
    });
  }

  async updateMovie(user: JwtPayload, movieId: string, data: Record<string, unknown>) {
    await connectDB();
    const movie = await Movie.findById(movieId);
    if (!movie) throw new Error("Movie not found");
    if (
      movie.ownerId &&
      user.role !== ROLES.SUPER_ADMIN &&
      movie.ownerId.toString() !== resolveOwnerId(user)
    ) {
      throw new Error("Access denied");
    }
    const fields = [
      "title",
      "description",
      "poster",
      "backdrop",
      "trailerUrl",
      "duration",
      "languages",
      "genres",
      "rating",
      "certification",
      "status",
    ];
    for (const f of fields) {
      if (data[f] !== undefined) (movie as unknown as Record<string, unknown>)[f] = data[f];
    }
    if (data.releaseDate) movie.releaseDate = new Date(String(data.releaseDate));
    await movie.save();
    return movie;
  }

  /* ── Shows ── */
  async listShows(user: JwtPayload, theatreId?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatreIds = theatreId
      ? [oid(theatreId)]
      : await getOwnerTheatreIds(ownerId, { includePending: true });

    return Show.find({ theatreId: { $in: theatreIds } })
      .populate("movieId", "title poster duration languages")
      .populate("screenId", "name")
      .populate("theatreId", "name city")
      .sort({ startTime: 1 })
      .lean();
  }

  async createShows(
    user: JwtPayload,
    data: {
      movieId: string;
      theatreId: string;
      screenId: string;
      date: string;
      times: string[];
      language?: string;
      format?: string;
      basePrice: number;
      pricing?: { seatType: string; price: number }[];
      weekendPricing?: { seatType: string; price: number }[];
      holidayPricing?: { seatType: string; price: number }[];
      recurringDays?: number;
    }
  ) {
    await connectDB();
    const theatre = await Theatre.findById(data.theatreId);
    if (!theatre) throw new Error("Theatre not found");
    if (
      user.role !== ROLES.SUPER_ADMIN &&
      theatre.ownerId.toString() !== resolveOwnerId(user)
    ) {
      throw new Error("Access denied");
    }

    const screen = await Screen.findById(data.screenId);
    if (!screen || screen.theatreId.toString() !== data.theatreId) {
      throw new Error("Invalid screen");
    }
    const movie = await Movie.findById(data.movieId);
    if (!movie) throw new Error("Movie not found");

    const days = Math.max(1, Math.min(data.recurringDays || 1, 30));
    const groupId = days > 1 ? nanoid(10) : undefined;
    const created = [];
    const pricing = data.pricing || [
      { seatType: "regular", price: data.basePrice },
      { seatType: "premium", price: Math.round(data.basePrice * 1.4) },
      { seatType: "vip", price: Math.round(data.basePrice * 2) },
    ];

    for (let d = 0; d < days; d++) {
      for (const time of data.times) {
        const [hh, mm] = time.split(":").map(Number);
        const date = new Date(data.date);
        date.setDate(date.getDate() + d);
        date.setHours(0, 0, 0, 0);
        const start = new Date(date);
        start.setHours(hh, mm || 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + (movie.duration || 150) + 15);

        created.push({
          movieId: data.movieId,
          theatreId: data.theatreId,
          screenId: data.screenId,
          ownerId: theatre.ownerId,
          date,
          startTime: start,
          endTime: end,
          language: data.language || movie.languages?.[0] || "Hindi",
          format: data.format || "2D",
          basePrice: data.basePrice,
          pricing,
          weekendPricing: data.weekendPricing,
          holidayPricing: data.holidayPricing,
          availableSeats: screen.capacity,
          totalSeats: screen.capacity,
          bookedSeats: [],
          status: "scheduled",
          recurrenceGroupId: groupId,
          isActive: true,
        });
      }
    }

    return Show.insertMany(created);
  }

  async updateShow(user: JwtPayload, showId: string, data: Record<string, unknown>) {
    await connectDB();
    const show = await Show.findById(showId);
    if (!show) throw new Error("Show not found");
    const theatre = await Theatre.findById(show.theatreId);
    if (
      !theatre ||
      (user.role !== ROLES.SUPER_ADMIN &&
        theatre.ownerId.toString() !== resolveOwnerId(user))
    ) {
      throw new Error("Access denied");
    }

    if (data.action === "cancel") {
      show.status = "cancelled";
      show.isActive = false;
      show.cancelledAt = new Date();
      show.cancelReason = String(data.reason || "Cancelled by operator");
    } else if (data.action === "reschedule" && data.startTime) {
      const oldId = show._id;
      show.status = "rescheduled";
      show.isActive = false;
      await show.save();

      const start = new Date(String(data.startTime));
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 165);
      const date = new Date(start);
      date.setHours(0, 0, 0, 0);

      return Show.create({
        movieId: show.movieId,
        theatreId: show.theatreId,
        screenId: show.screenId,
        ownerId: show.ownerId || theatre.ownerId,
        date,
        startTime: start,
        endTime: end,
        language: show.language,
        format: show.format,
        basePrice: show.basePrice,
        pricing: show.pricing,
        weekendPricing: show.weekendPricing,
        holidayPricing: show.holidayPricing,
        availableSeats: show.availableSeats,
        totalSeats: show.totalSeats,
        bookedSeats: show.bookedSeats,
        status: "scheduled",
        rescheduledFrom: oldId,
        isActive: true,
      });
    } else {
      if (data.basePrice != null) show.basePrice = Number(data.basePrice);
      if (data.pricing) show.pricing = data.pricing as typeof show.pricing;
      if (data.weekendPricing)
        show.weekendPricing = data.weekendPricing as typeof show.weekendPricing;
      if (data.holidayPricing)
        show.holidayPricing = data.holidayPricing as typeof show.holidayPricing;
      if (data.isActive !== undefined) show.isActive = Boolean(data.isActive);
    }

    await show.save();
    return show;
  }

  /* ── Staff ── */
  async listStaff(user: JwtPayload) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    return User.find({
      ownerId,
      role: { $in: STAFF_ROLES },
    })
      .select("-password")
      .populate("theatreIds", "name city")
      .sort({ createdAt: -1 })
      .lean();
  }

  async createStaff(
    user: JwtPayload,
    data: {
      name: string;
      email: string;
      phone?: string;
      password?: string;
      role: Role;
      theatreIds?: string[];
      customPermissions?: Permission[];
    }
  ) {
    await connectDB();
    if (user.role !== ROLES.THEATRE_OWNER && user.role !== ROLES.MANAGER) {
      throw new Error("Permission denied");
    }
    if (!STAFF_ROLES.includes(data.role) && data.role !== ROLES.MANAGER) {
      throw new Error("Invalid staff role");
    }
    const ownerId = resolveOwnerId(user);
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error("Email already registered");

    const password = await hashPassword(data.password || "Password1");
    const staff = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password,
      role: data.role,
      ownerId,
      tenantId: ownerId,
      theatreIds: data.theatreIds || [],
      customPermissions: data.customPermissions || [],
      isEmailVerified: true,
      referralCode: nanoid(8).toUpperCase(),
    });

    return User.findById(staff._id).select("-password").lean();
  }

  async updateStaff(user: JwtPayload, staffId: string, data: Record<string, unknown>) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const staff = await User.findOne({ _id: staffId, ownerId });
    if (!staff) throw new Error("Staff not found");

    if (data.name) staff.name = String(data.name);
    if (data.role && STAFF_ROLES.includes(data.role as Role)) staff.role = data.role as Role;
    if (data.theatreIds) staff.theatreIds = data.theatreIds as mongoose.Types.ObjectId[];
    if (data.customPermissions) staff.customPermissions = data.customPermissions as string[];
    if (data.isActive !== undefined) staff.isActive = Boolean(data.isActive);
    if (data.password) staff.password = await hashPassword(String(data.password));
    await staff.save();
    return User.findById(staffId).select("-password").lean();
  }

  /* ── Revenue analytics ── */
  async revenueDashboard(
    user: JwtPayload,
    opts: { preset?: string; from?: string; to?: string; theatreId?: string }
  ) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const { start, end } =
      opts.from || opts.to
        ? parseDateRange(opts.from, opts.to)
        : rangePreset(opts.preset || "today");

    let theatreIds = await getOwnerTheatreIds(ownerId, { includePending: true });
    if (opts.theatreId) {
      theatreIds = theatreIds.filter((id) => id.toString() === opts.theatreId);
    }

    const match = {
      theatreId: { $in: theatreIds },
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["confirmed", "cancelled"] },
    };

    const bookings = await Booking.find(match).lean();
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");

    const sum = (arr: typeof confirmed, key: "finalAmount" | "tax" | "refundAmount") =>
      arr.reduce((a, b) => a + (Number(b[key]) || 0), 0);

    const byMethod = (method: string) =>
      sum(
        confirmed.filter((b) => (b.paymentMethod || "").toLowerCase() === method),
        "finalAmount"
      );

    const online = sum(
      confirmed.filter((b) => b.channel === "online"),
      "finalAmount"
    );
    const offline = sum(
      confirmed.filter((b) => b.channel === "pos" || b.channel === "walkin"),
      "finalAmount"
    );

    const ticketsSold = confirmed.reduce((a, b) => a + (b.seats?.length || 0), 0);
    const shows = await Show.find({
      theatreId: { $in: theatreIds },
      date: { $gte: start, $lte: end },
    }).lean();
    const availableSeats = shows.reduce((a, s) => a + (s.availableSeats || 0), 0);
    const totalSeats = shows.reduce((a, s) => a + (s.totalSeats || 0), 0);
    const occupancy = totalSeats ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

    // Trends by day
    const trendMap = new Map<string, { revenue: number; tickets: number }>();
    for (const b of confirmed) {
      const day = new Date(b.createdAt).toISOString().slice(0, 10);
      const cur = trendMap.get(day) || { revenue: 0, tickets: 0 };
      cur.revenue += b.finalAmount || 0;
      cur.tickets += b.seats?.length || 0;
      trendMap.set(day, cur);
    }

    const movieRev = new Map<string, number>();
    const showRev = new Map<string, number>();
    const theatreRev = new Map<string, number>();
    for (const b of confirmed) {
      const mid = b.movieId?.toString();
      const sid = b.showId?.toString();
      const tid = b.theatreId?.toString();
      if (mid) movieRev.set(mid, (movieRev.get(mid) || 0) + (b.finalAmount || 0));
      if (sid) showRev.set(sid, (showRev.get(sid) || 0) + (b.finalAmount || 0));
      if (tid) theatreRev.set(tid, (theatreRev.get(tid) || 0) + (b.finalAmount || 0));
    }

    const movieIds = [...movieRev.keys()];
    const movies = await Movie.find({ _id: { $in: movieIds } }).select("title").lean();
    const movieNames = new Map(movies.map((m) => [m._id.toString(), m.title]));
    const theatres = await Theatre.find({ _id: { $in: [...theatreRev.keys()] } })
      .select("name")
      .lean();
    const theatreNames = new Map(theatres.map((t) => [t._id.toString(), t.name]));

    const gross = sum(confirmed, "finalAmount");
    const refundAmt = sum(cancelled, "refundAmount") || cancelled.reduce((a, b) => a + (b.finalAmount || 0), 0);

    return {
      start,
      end,
      metrics: {
        totalRevenue: gross,
        onlineRevenue: online,
        offlineRevenue: offline,
        cashRevenue: byMethod("cash"),
        cardRevenue: byMethod("card"),
        upiRevenue: byMethod("upi"),
        walletRevenue: byMethod("wallet"),
        taxCollected: sum(confirmed, "tax"),
        refundAmount: refundAmt,
        netRevenue: gross - refundAmt,
        occupancyPercent: occupancy,
        averageTicketPrice: confirmed.length ? Math.round(gross / confirmed.length) : 0,
        totalBookings: confirmed.length,
        ticketsSold,
        availableSeats,
      },
      charts: {
        revenueTrend: [...trendMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, v]) => ({ date, ...v })),
        occupancyTrend: [...trendMap.entries()].map(([date, v]) => ({
          date,
          occupancy: v.tickets,
        })),
        movieWise: [...movieRev.entries()]
          .map(([id, revenue]) => ({ id, name: movieNames.get(id) || id, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        showWise: [...showRev.entries()]
          .map(([id, revenue]) => ({ id, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10),
        theatreWise: [...theatreRev.entries()].map(([id, revenue]) => ({
          id,
          name: theatreNames.get(id) || id,
          revenue,
        })),
      },
    };
  }

  async theatreAnalytics(user: JwtPayload, theatreId: string, preset?: string) {
    await connectDB();
    const ownerId = resolveOwnerId(user);
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) throw new Error("Theatre not found");
    if (user.role !== ROLES.SUPER_ADMIN && theatre.ownerId.toString() !== ownerId) {
      throw new Error("Access denied");
    }

    const { start, end } = rangePreset(preset || "month");
    const bookings = await Booking.find({
      theatreId,
      status: "confirmed",
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const revenue = bookings.reduce((a, b) => a + (b.finalAmount || 0), 0);
    const tickets = bookings.reduce((a, b) => a + (b.seats?.length || 0), 0);
    const movieCounts = new Map<string, { count: number; revenue: number }>();
    const showCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    const customers = new Set<string>();
    const customerBookings = new Map<string, number>();

    for (const b of bookings) {
      const mid = b.movieId.toString();
      const cur = movieCounts.get(mid) || { count: 0, revenue: 0 };
      cur.count += b.seats?.length || 0;
      cur.revenue += b.finalAmount || 0;
      movieCounts.set(mid, cur);
      showCounts.set(b.showId.toString(), (showCounts.get(b.showId.toString()) || 0) + 1);
      const hour = new Date(b.createdAt).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      const cid = b.userId?.toString() || b.customerPhone || "";
      if (cid) {
        customers.add(cid);
        customerBookings.set(cid, (customerBookings.get(cid) || 0) + 1);
      }
    }

    const bestMovieId = [...movieCounts.entries()].sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0];
    const bestShowId = [...showCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const peakHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const repeats = [...customerBookings.values()].filter((n) => n > 1).length;

    const movie = bestMovieId ? await Movie.findById(bestMovieId).select("title").lean() : null;
    const shows = await Show.find({ theatreId, date: { $gte: start, $lte: end } }).lean();
    const totalSeats = shows.reduce((a, s) => a + s.totalSeats, 0);
    const available = shows.reduce((a, s) => a + s.availableSeats, 0);

    return {
      theatre: { id: theatre._id, name: theatre.name, city: theatre.city },
      revenue,
      ticketsSold: tickets,
      occupancy: totalSeats ? Math.round(((totalSeats - available) / totalSeats) * 100) : 0,
      bestSellingMovie: movie?.title || "—",
      bestSellingShowId: bestShowId || null,
      peakHours: peakHour != null ? `${peakHour}:00` : "—",
      customerCount: customers.size,
      repeatCustomers: repeats,
    };
  }

  getRolePermissions(role: Role) {
    return ROLE_PERMISSIONS[role] || [];
  }
}

export const multiTheaterService = new MultiTheaterService();
