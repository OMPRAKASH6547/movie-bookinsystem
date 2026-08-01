import { withAuth, type AuthenticatedRequest } from "@/lib/api/with-auth";
import { getDemoTicket } from "@/lib/booking/demo-store";
import { generateTicketPDF } from "@/lib/pdf/ticket";
import { errorResponse } from "@/utils/api-response";
import { connectDB } from "@/lib/db/mongodb";
import { Booking } from "@/models/Booking";
import { Movie } from "@/models/Movie";
import { Theatre } from "@/models/Theatre";
import { Show } from "@/models/Show";
import { User } from "@/models/User";

export const GET = withAuth(async (req: AuthenticatedRequest, context) => {
  try {
    const { id } = await context.params;

    const demo = await getDemoTicket(id);
    if (demo) {
      if (demo.userId !== req.user.sub && req.user.role === "customer") {
        return errorResponse("Unauthorized", 403);
      }
      const pdf = await generateTicketPDF({
        bookingNumber: demo.bookingNumber,
        movieTitle: demo.movieTitle,
        theatre: demo.theatreName,
        date: demo.date,
        time: demo.time,
        seats: demo.seats.map((s) => s.seatId).join(", "),
        amount: demo.finalAmount,
        customerName: demo.userName,
        qrCodeDataUrl: demo.qrCode,
      });

      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="ticket-${demo.bookingNumber}.pdf"`,
        },
      });
    }

    await connectDB();
    const booking = await Booking.findById(id);
    if (!booking) return errorResponse("Booking not found", 404);
    if (booking.userId.toString() !== req.user.sub) {
      return errorResponse("Unauthorized", 403);
    }

    const [movie, theatre, show, user] = await Promise.all([
      Movie.findById(booking.movieId),
      Theatre.findById(booking.theatreId),
      Show.findById(booking.showId),
      User.findById(booking.userId),
    ]);

    const pdf = await generateTicketPDF({
      bookingNumber: booking.bookingNumber,
      movieTitle: movie?.title || "Movie",
      theatre: theatre?.name || "Theatre",
      date: show?.date || booking.createdAt,
      time: show?.startTime || booking.createdAt,
      seats: booking.seats.map((s) => `${s.row}${s.number}`).join(", "),
      amount: booking.finalAmount,
      customerName: user?.name || "Guest",
      qrCodeDataUrl: booking.qrCode,
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${booking.bookingNumber}.pdf"`,
      },
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "PDF generation failed",
      500
    );
  }
});
