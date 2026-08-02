import { api } from "@/lib/api/client";

/** Fetch booking PDF and trigger a browser download. */
export async function downloadTicketPdf(bookingId: string, bookingNumber: string) {
  const res = await api.get(`/bookings/${bookingId}/pdf`, {
    responseType: "blob",
    headers: { Accept: "application/pdf" },
  });

  const blob = res.data as Blob;
  if (!(blob instanceof Blob) || blob.size < 8) {
    throw new Error("Invalid PDF response");
  }

  // API errors often arrive as JSON when responseType is blob
  if (blob.type.includes("json") || blob.type.includes("text")) {
    const text = await blob.text();
    let message = "PDF download failed";
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const magic = await blob.slice(0, 5).text();
  if (!magic.startsWith("%PDF")) {
    throw new Error("Server did not return a valid PDF");
  }

  const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-${bookingNumber}.pdf`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
