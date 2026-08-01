import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export type EmptyVariant =
  | "movies"
  | "bookings"
  | "revenue"
  | "staff"
  | "customers"
  | "shows"
  | "reports"
  | "theatres"
  | "notifications"
  | "generic";

const COPY: Record<
  EmptyVariant,
  { title: string; description: string; actionLabel?: string; actionHref?: string }
> = {
  movies: {
    title: "No movies",
    description: "There are no movies to show right now. Check back soon or add a title.",
    actionLabel: "Browse movies",
    actionHref: "/movies",
  },
  bookings: {
    title: "No bookings yet",
    description: "Your tickets will appear here after you book a show.",
    actionLabel: "Find a movie",
    actionHref: "/movies",
  },
  revenue: {
    title: "No revenue data",
    description: "Sales for this period will show up once bookings start coming in.",
  },
  staff: {
    title: "No staff members",
    description: "Add counter staff, managers, or checkers to get started.",
    actionLabel: "Add staff",
    actionHref: "/theatre/staff",
  },
  customers: {
    title: "No customers found",
    description: "Try a different name, phone, or email.",
  },
  shows: {
    title: "No shows scheduled",
    description: "Create showtimes so customers can book seats.",
    actionLabel: "Manage shows",
    actionHref: "/theatre/shows",
  },
  reports: {
    title: "No report rows",
    description: "Adjust filters or date range, then generate again.",
  },
  theatres: {
    title: "No theatres",
    description: "Create your first theatre to start selling tickets.",
    actionLabel: "Add theatre",
    actionHref: "/theatre/theatres",
  },
  notifications: {
    title: "You're all caught up",
    description: "No new notifications right now.",
  },
  generic: {
    title: "Nothing here",
    description: "There's no data to display yet.",
  },
};

export function EmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  icon,
}: {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) {
  const base = COPY[variant];
  const t = title || base.title;
  const d = description || base.description;
  const label = actionLabel || base.actionLabel;
  const href = actionHref || base.actionHref;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="font-semibold text-lg">{t}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{d}</p>
      {(label && href) || onAction ? (
        <div className="mt-5">
          {onAction ? (
            <Button onClick={onAction}>{label || "Try again"}</Button>
          ) : href ? (
            <Button asChild>
              <Link href={href}>{label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
