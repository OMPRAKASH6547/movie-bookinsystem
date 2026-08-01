import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-8 py-6 shadow-lg">
        <Spinner size="lg" className="text-accent" />
        <p className="text-sm text-muted-foreground">Loading CinePass…</p>
      </div>
    </div>
  );
}
