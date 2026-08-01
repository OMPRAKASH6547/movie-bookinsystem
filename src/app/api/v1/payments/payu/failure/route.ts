import { NextRequest, NextResponse } from "next/server";
import { getDemoTicket, saveDemoTicket } from "@/lib/booking/demo-store";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const bookingId = String(formData.get("udf1") || "");
  if (bookingId) {
    const ticket = await getDemoTicket(bookingId);
    if (ticket && ticket.status === "pending") {
      ticket.status = "cancelled";
      await saveDemoTicket(ticket);
    }
  }
  return NextResponse.redirect(`${APP_URL}/bookings?payu=failed`);
}

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("udf1") || "";
  if (bookingId) {
    const ticket = await getDemoTicket(bookingId);
    if (ticket && ticket.status === "pending") {
      ticket.status = "cancelled";
      await saveDemoTicket(ticket);
    }
  }
  return NextResponse.redirect(`${APP_URL}/bookings?payu=failed`);
}
