import { Suspense } from "react";
import { MoviesClient } from "./movies-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10 grid grid-cols-2 md:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      }
    >
      <MoviesClient />
    </Suspense>
  );
}
