import { MovieGridSkeleton } from "@/components/loading/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div className="container-page py-10 space-y-6">
      <Skeleton className="h-10 w-64" />
      <MovieGridSkeleton />
    </div>
  );
}
