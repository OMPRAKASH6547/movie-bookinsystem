import QRCode from "qrcode";
import { bookingRepository } from "@/repositories/booking.repository";
import { Show } from "@/models/Show";
import { Screen } from "@/models/Screen";
import { Coupon } from "@/models/Coupon";
import { Payment } from "@/models/Payment";
import { Notification } from "@/models/Notification";
import { Wallet, Transaction } from "@/models/Wallet";
import { seatLock } from "@/lib/redis/client";
import { sendEmail } from "@/lib/email/mailer";
import { bookingConfirmationEmail } from "@/lib/email/templates";
import { generateBookingNumber, formatCurrency, formatDate, formatTime } from "@/utils/format";
import { BOOKING_STATUS, PAYMENT_STATUS, TOKEN_CONFIG } from "@/constants";
import { User } from "@/models/User";
import { Movie } from "@/models/Movie";
import { Theatre } from "@/models/Theatre";
import { logger } from "@/lib/logger";

export class BookingService {
  async lockSeats(userId: string, showId: string, seatIds: string[]) {
    const show = await Show.findById(showId);
    if (!show || !show.isActive) throw new Error("Show not found");

    const alreadyBooked = seatIds.filter((id) => show.bookedSeats.includes(id));
    if (alreadyBooked.length) {
      throw new Error(`Seats already booked: ${alreadyBooked.join(", ")}`);
    }

    const results = await Promise.all(
      seatIds.map((seatId) =>
        seatLock.lock(showId, seatId, userId, TOKEN_CONFIG.SEAT_LOCK_SECONDS)
      )
    );

    if (results.some((r) => !r)) {
      await Promise.all(seatIds.map((id) => seatLock.unlock(showId, id, userId)));
      throw new Error("One or more seats are locked by another user");
    }

    return {
      locked: seatIds,
      expiresIn: TOKEN_CONFIG.SEAT_LOCK_SECONDS,
      expiresAt: new Date(Date.now() + TOKEN_CONFIG.SEAT_LOCK_SECONDS * 1000),
    };
  }

  async getSeatAvailability(showId: string) {
    const show = await Show.findById(showId).populate("screenId");
    if (!show) throw new Error("Show not found");

    const screen = await Screen.findById(show.screenId);
    if (!screen) throw new Error("Screen not found");

    const seatIds = screen.seatLayout.seats.map((s) => s.id);
    const locks = await seatLock.getLocks(showId, seatIds);

    const seats = screen.seatLayout.seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      price: seat.price,
      isAvailable: seat.isAvailable,
      isAisle: seat.isAisle,
      status: show.bookedSeats.includes(seat.id)
        ? "booked"
        : locks[seat.id]
          ? "locked"
          : "available",
      lockedBy: locks[seat.id] || null,
    }));

    return {
      showId,
      layout: { rows: screen.seatLayout.rows, columns: screen.seatLayout.columns },
      seats,
      availableSeats: show.availableSeats,
      pricing: show.pricing,
    };
  }

  async applyCoupon(code: string, amount: number) {
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!coupon) throw new Error("Invalid or expired coupon");
    if (coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");
    if (amount < coupon.minAmount) {
      throw new Error(`Minimum amount ₹${coupon.minAmount} required`);
    }

    let discount =
      coupon.discountType === "percentage"
        ? (amount * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, amount);

    return {
      code: coupon.code,
      discount,
      finalAmount: amount - discount,
      description: coupon.description,
    };
  }

  async createBooking(
    userId: string,
    data: {
      showId: string;
      seatIds: string[];
      couponCode?: string;
      paymentMethod: string;
    }
  ) {
    const show = await Show.findById(data.showId);
    if (!show || !show.isActive) throw new Error("Show not found");

    const screen = await Screen.findById(show.screenId);
    if (!screen) throw new Error("Screen not found");

    // Verify locks
    for (const seatId of data.seatIds) {
      const locks = await seatLock.getLocks(data.showId, [seatId]);
      if (locks[seatId] && locks[seatId] !== userId) {
        throw new Error(`Seat ${seatId} is locked by another user`);
      }
      if (show.bookedSeats.includes(seatId)) {
        throw new Error(`Seat ${seatId} is already booked`);
      }
    }

    const selectedSeats = screen.seatLayout.seats.filter((s) =>
      data.seatIds.includes(s.id)
    );

    if (selectedSeats.length !== data.seatIds.length) {
      throw new Error("Invalid seat selection");
    }

    const pricingMap = Object.fromEntries(show.pricing.map((p) => [p.seatType, p.price]));

    const seats = selectedSeats.map((s) => ({
      seatId: s.id,
      row: s.row,
      number: s.number,
      type: s.type,
      price: pricingMap[s.type] ?? s.price ?? show.basePrice,
    }));

    const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
    let discount = 0;

    if (data.couponCode) {
      const couponResult = await this.applyCoupon(data.couponCode, totalAmount);
      discount = couponResult.discount;
      await Coupon.updateOne(
        { code: data.couponCode.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    const taxable = totalAmount - discount;
    const tax = Math.round(taxable * 0.18);
    const finalAmount = taxable + tax;

    const booking = await bookingRepository.create({
      bookingNumber: generateBookingNumber(),
      userId,
      showId: show._id,
      movieId: show.movieId,
      theatreId: show.theatreId,
      seats,
      totalAmount,
      discount,
      tax,
      finalAmount,
      couponCode: data.couponCode?.toUpperCase(),
      status: BOOKING_STATUS.PENDING,
      lockedUntil: new Date(Date.now() + TOKEN_CONFIG.SEAT_LOCK_SECONDS * 1000),
    } as never);

    const payment = await Payment.create({
      bookingId: booking._id,
      userId,
      amount: finalAmount,
      method: data.paymentMethod,
      status: PAYMENT_STATUS.PENDING,
      gatewayOrderId: `ORD_${booking.bookingNumber}`,
    });

    booking.paymentId = payment._id;
    await booking.save();

    // Wallet payment — instant confirm
    if (data.paymentMethod === "wallet") {
      return this.confirmPayment(booking._id.toString(), userId, {
        transactionId: `WALLET_${Date.now()}`,
        method: "wallet",
      });
    }

    // Demo mode: auto-confirm card/upi for development
    if (process.env.PAYMENT_DEMO_MODE !== "false") {
      return this.confirmPayment(booking._id.toString(), userId, {
        transactionId: `DEMO_${Date.now()}`,
        method: data.paymentMethod,
      });
    }

    return {
      booking,
      payment: {
        id: payment._id,
        amount: finalAmount,
        orderId: payment.gatewayOrderId,
        method: data.paymentMethod,
      },
    };
  }

  async confirmPayment(
    bookingId: string,
    userId: string,
    data: { transactionId: string; method: string }
  ) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId.toString() !== userId) throw new Error("Unauthorized");
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      return { booking, alreadyConfirmed: true };
    }

    if (data.method === "wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < booking.finalAmount) {
        throw new Error("Insufficient wallet balance");
      }
      wallet.balance -= booking.finalAmount;
      await wallet.save();
      await Transaction.create({
        walletId: wallet._id,
        userId,
        type: "debit",
        amount: booking.finalAmount,
        balanceAfter: wallet.balance,
        description: `Booking ${booking.bookingNumber}`,
        referenceType: "booking",
        referenceId: booking._id.toString(),
      });
    }

    const qrPayload = JSON.stringify({
      bookingNumber: booking.bookingNumber,
      seats: booking.seats.map((s) => `${s.row}${s.number}`),
      showId: booking.showId,
    });
    const qrCode = await QRCode.toDataURL(qrPayload);

    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.qrCode = qrCode;
    await booking.save();

    await Show.findByIdAndUpdate(booking.showId, {
      $addToSet: { bookedSeats: { $each: booking.seats.map((s) => s.seatId) } },
      $inc: { availableSeats: -booking.seats.length },
    });

    await Payment.findByIdAndUpdate(booking.paymentId, {
      status: PAYMENT_STATUS.COMPLETED,
      transactionId: data.transactionId,
      method: data.method,
    });

    for (const seat of booking.seats) {
      await seatLock.unlock(booking.showId.toString(), seat.seatId, userId);
    }

    const [user, movie, theatre, show] = await Promise.all([
      User.findById(userId),
      Movie.findById(booking.movieId),
      Theatre.findById(booking.theatreId),
      Show.findById(booking.showId),
    ]);

    await Notification.create({
      userId,
      title: "Booking Confirmed",
      message: `Your tickets for ${movie?.title || "the movie"} are confirmed.`,
      type: "booking",
      link: `/bookings/${booking._id}`,
    });

    if (user && movie && theatre && show) {
      const email = bookingConfirmationEmail({
        name: user.name,
        movieTitle: movie.title,
        theatre: theatre.name,
        date: formatDate(show.date),
        time: formatTime(show.startTime),
        seats: booking.seats.map((s) => `${s.row}${s.number}`).join(", "),
        bookingNumber: booking.bookingNumber,
        amount: formatCurrency(booking.finalAmount),
      });
      await sendEmail({ to: user.email, ...email });
    }

    // Reward points
    await User.findByIdAndUpdate(userId, {
      $inc: { rewardPoints: Math.floor(booking.finalAmount / 10) },
    });

    logger.info("Booking confirmed", { bookingNumber: booking.bookingNumber });

    return { booking, qrCode };
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.userId.toString() !== userId) throw new Error("Unauthorized");
    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new Error("Only confirmed bookings can be cancelled");
    }

    const show = await Show.findById(booking.showId);
    if (show && show.startTime.getTime() - Date.now() < 2 * 60 * 60 * 1000) {
      throw new Error("Cannot cancel within 2 hours of showtime");
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = reason;
    booking.refundAmount = booking.finalAmount;
    await booking.save();

    if (show) {
      await Show.findByIdAndUpdate(show._id, {
        $pull: { bookedSeats: { $in: booking.seats.map((s) => s.seatId) } },
        $inc: { availableSeats: booking.seats.length },
      });
    }

    const wallet = await Wallet.findOne({ userId });
    if (wallet) {
      wallet.balance += booking.finalAmount;
      await wallet.save();
      await Transaction.create({
        walletId: wallet._id,
        userId,
        type: "credit",
        amount: booking.finalAmount,
        balanceAfter: wallet.balance,
        description: `Refund for ${booking.bookingNumber}`,
        referenceType: "refund",
        referenceId: booking._id.toString(),
      });
    }

    await Payment.findByIdAndUpdate(booking.paymentId, {
      status: PAYMENT_STATUS.REFUNDED,
      refundAmount: booking.finalAmount,
      refundId: `REF_${booking.bookingNumber}`,
    });

    await Notification.create({
      userId,
      title: "Booking Cancelled",
      message: `Refund of ${formatCurrency(booking.finalAmount)} credited to wallet.`,
      type: "payment",
      link: `/wallet`,
    });

    return { booking, refundAmount: booking.finalAmount };
  }

  async getUserBookings(userId: string, page = 1, limit = 20) {
    return bookingRepository.findByUser(userId, page, limit);
  }

  async getBooking(userId: string, bookingId: string) {
    const { Booking } = await import("@/models/Booking");
    const booking = await Booking.findById(bookingId)
      .populate("movieId")
      .populate("theatreId")
      .populate("showId")
      .lean();

    if (!booking) throw new Error("Booking not found");
    if (booking.userId.toString() !== userId) throw new Error("Unauthorized");
    return booking;
  }
}

export const bookingService = new BookingService();
