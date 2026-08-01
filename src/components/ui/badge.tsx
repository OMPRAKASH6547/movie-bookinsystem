import { cn } from "@/utils/cn";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "accent" | "outline" | "success";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-primary/15 text-primary",
        variant === "accent" && "bg-accent/20 text-accent-foreground dark:text-accent",
        variant === "outline" && "border border-border text-muted-foreground",
        variant === "success" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        className
      )}
      {...props}
    />
  );
}
