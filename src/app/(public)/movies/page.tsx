import { Suspense } from "react";
import { MoviesClient } from "./movies-client";
import { MovieGridSkeleton } from "@/components/loading/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10 space-y-6">
          <Skeleton className="h-10 w-56" />
          <MovieGridSkeleton />
        </div>
      }
    >
      <MoviesClient />
    </Suspense>
  );
}
