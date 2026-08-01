import { FormSkeleton } from "@/components/loading/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-40 mx-auto" />
        <FormSkeleton fields={3} />
      </div>
    </div>
  );
}
