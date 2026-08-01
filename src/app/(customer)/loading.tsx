import { ListSkeleton, PageHeaderSkeleton } from "@/components/loading/skeletons";

export default function CustomerLoading() {
  return (
    <div className="container-page py-8 space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton count={4} />
    </div>
  );
}
