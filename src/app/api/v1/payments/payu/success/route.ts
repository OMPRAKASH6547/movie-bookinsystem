import { NextRequest, NextResponse } from "next/server";
import { verifyPayUResponse } from "@/lib/payment/payu";
import { getDemoTicket, saveDemoTicket } from "@/lib/booking/demo-store";
import { logger } from "@/lib/logger";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function handlePayUSuccess(form: Record<string, string>) {
  const verified =
    process.env.PAYU_SKIP_HASH_CHECK === "true" ||
    verifyPayUResponse({
      status: form.status || "",
      txnid: form.txnid || "",
      amount: form.amount || "",
      productinfo: form.productinfo || "",
      firstname: form.firstname || "",
      email: form.email || "",
      udf1: form.udf1,
      udf2: form.udf2,
      udf3: form.udf3,
      udf4: form.udf4,
      udf5: form.udf5,
      hash: form.hash || "",
    });

  if (!verified && form.status === "success") {
    logger.warn("PayU hash verification failed", { txnid: form.txnid });
  }

  const bookingId = form.udf1;
  if (bookingId && (form.status === "success" || verified)) {
    const ticket = await getDemoTicket(bookingId);
    if (ticket) {
      ticket.status = "confirmed";
      ticket.transactionId = form.txnid || ticket.transactionId;
      ticket.paymentMethod = "payu";
      await saveDemoTicket(ticket);
      return NextResponse.redirect(`${APP_URL}/bookings/${ticket._id}?paid=1`);
    }
  }

  return NextResponse.redirect(`${APP_URL}/bookings?payu=success&txn=${form.txnid || ""}`);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const form: Record<string, string> = {};
  formData.forEach((value, key) => {
    form[key] = String(value);
  });
  return handlePayUSuccess(form);
}

export async function GET(req: NextRequest) {
  const form = Object.fromEntries(req.nextUrl.searchParams.entries());
  return handlePayUSuccess(form);
}
