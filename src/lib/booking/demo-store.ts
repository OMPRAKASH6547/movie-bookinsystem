import QRCode from "qrcode";
import { cache } from "@/lib/redis/client";
import { generateBookingNumber } from "@/utils/format";

export interface DemoTicket {
  _id: string;
  bookingNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  movieSlug: string;
  theatreId: string;
  theatreName: string;
  showId: string;
  date: string;
  time: string;
  seats: { seatId: string; row: string; number: number; type: string; price: number }[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  couponCode?: string;
  status: "confirmed" | "cancelled" | "pending";
  paymentMethod: string;
  transactionId: string;
  qrCode: string;
  createdAt: string;
  cancelledAt?: string;
  refundAmount?: number;
}

const INDEX_KEY = "demo_bookings_index";

async function getIndex(): Promise<string[]> {
  const raw = await cache.get(INDEX_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function setIndex(ids: string[]) {
  await cache.set(INDEX_KEY, JSON.stringify(ids.slice(-200)), 60 * 60 * 24 * 30);
}

export async function saveDemoTicket(ticket: DemoTicket): Promise<void> {
  await cache.set(`demo_booking:${ticket._id}`, JSON.stringify(ticket), 60 * 60 * 24 * 30);
  await cache.set(
    `demo_booking_num:${ticket.bookingNumber}`,
    ticket._id,
    60 * 60 * 24 * 30
  );
  const index = await getIndex();
  if (!index.includes(ticket._id)) {
    index.push(ticket._id);
    await setIndex(index);
  }
  const userKey = `demo_user_bookings:${ticket.userId}`;
  const userRaw = await cache.get(userKey);
  const userIds: string[] = userRaw ? JSON.parse(userRaw) : [];
  if (!userIds.includes(ticket._id)) {
    userIds.unshift(ticket._id);
    await cache.set(userKey, JSON.stringify(userIds), 60 * 60 * 24 * 30);
  }
}

export async function getDemoTicket(id: string): Promise<DemoTicket | null> {
  const raw = await cache.get(`demo_booking:${id}`);
  return raw ? (JSON.parse(raw) as DemoTicket) : null;
}

export async function getDemoTicketByNumber(num: string): Promise<DemoTicket | null> {
  const id = await cache.get(`demo_booking_num:${num}`);
  if (!id) return null;
  return getDemoTicket(id);
}

export async function listDemoTickets(userId: string): Promise<DemoTicket[]> {
  const userRaw = await cache.get(`demo_user_bookings:${userId}`);
  const ids: string[] = userRaw ? JSON.parse(userRaw) : [];
  const tickets = await Promise.all(ids.map((id) => getDemoTicket(id)));
  return tickets.filter((t): t is DemoTicket => !!t);
}

export async function cancelDemoTicket(
  userId: string,
  id: string
): Promise<DemoTicket | null> {
  const ticket = await getDemoTicket(id);
  if (!ticket || ticket.userId !== userId) return null;
  if (ticket.status !== "confirmed") return null;
  ticket.status = "cancelled";
  ticket.cancelledAt = new Date().toISOString();
  ticket.refundAmount = ticket.finalAmount;
  await saveDemoTicket(ticket);
  return ticket;
}

export async function createDemoTicket(input: {
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  movieSlug: string;
  theatreId: string;
  theatreName: string;
  showId: string;
  date: string;
  time: string;
  seats: { seatId: string; row: string; number: number; type: string; price: number }[];
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  couponCode?: string;
  paymentMethod: string;
  transactionId: string;
  status?: "confirmed" | "cancelled" | "pending";
}): Promise<DemoTicket> {
  const bookingNumber = generateBookingNumber();
  const id = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const qrPayload = JSON.stringify({
    bookingNumber,
    movie: input.movieTitle,
    theatre: input.theatreName,
    date: input.date,
    time: input.time,
    seats: input.seats.map((s) => s.seatId),
    amount: input.finalAmount,
  });

  const qrCode = await QRCode.toDataURL(qrPayload, {
    width: 320,
    margin: 2,
    color: { dark: "#0a0908", light: "#ffffff" },
  });

  const ticket: DemoTicket = {
    _id: id,
    bookingNumber,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    movieId: input.movieId,
    movieTitle: input.movieTitle,
    moviePoster: input.moviePoster,
    movieSlug: input.movieSlug,
    theatreId: input.theatreId,
    theatreName: input.theatreName,
    showId: input.showId,
    date: input.date,
    time: input.time,
    seats: input.seats,
    totalAmount: input.totalAmount,
    discount: input.discount,
    tax: input.tax,
    finalAmount: input.finalAmount,
    couponCode: input.couponCode,
    status: input.status || "confirmed",
    paymentMethod: input.paymentMethod,
    transactionId: input.transactionId,
    qrCode,
    createdAt: new Date().toISOString(),
  };

  await saveDemoTicket(ticket);
  return ticket;
}
