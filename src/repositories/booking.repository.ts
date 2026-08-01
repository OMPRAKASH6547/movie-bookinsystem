import { BaseRepository } from "./base.repository";
import { Booking, IBooking } from "@/models/Booking";

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find({ userId })
        .populate("movieId", "title poster slug")
        .populate("theatreId", "name city")
        .populate("showId", "date startTime language format")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.count({ userId }),
    ]);
    return { items, total, page, limit };
  }

  async findByNumber(bookingNumber: string): Promise<IBooking | null> {
    return this.findOne({ bookingNumber });
  }

  async getRevenueStats(theatreId?: string) {
    const match = theatreId
      ? { status: "confirmed", theatreId }
      : { status: "confirmed" };

    const result = await this.model.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalBookings: { $sum: 1 },
          avgTicket: { $avg: "$finalAmount" },
        },
      },
    ]);

    return result[0] || { totalRevenue: 0, totalBookings: 0, avgTicket: 0 };
  }
}

export const bookingRepository = new BookingRepository();
