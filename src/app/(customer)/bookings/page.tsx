import { Suspense } from "react";
import BookingsList from "./bookings-list";
import { ListSkeleton, PageHeaderSkeleton } from "@/components/loading/skeletons";

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl space-y-6 p-4 md:p-0">
          <PageHeaderSkeleton />
          <ListSkeleton count={3} />
        </div>
      }
    >
      <BookingsList />
    </Suspense>
  );
}
