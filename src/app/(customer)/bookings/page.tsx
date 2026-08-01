import { Suspense } from "react";
import BookingsList from "./bookings-list";

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading bookings…</div>}>
      <BookingsList />
    </Suspense>
  );
}
