"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export function getHttpErrorMessage(status?: number, fallback?: string) {
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403) return "You do not have permission to access this resource.";
  if (status === 404) return "We couldn't find what you're looking for.";
  if (status === 422) return "Some of the submitted data looks invalid.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status && status >= 500) return "Something went wrong on our side. Please try again.";
  return fallback || "Something went wrong. Please try again.";
}

export function ErrorState({
  title = "Couldn't load this page",
  message,
  status,
  onRetry,
  onRefresh,
  className,
}: {
  title?: string;
  message?: string;
  status?: number;
  onRetry?: () => void;
  onRefresh?: () => void;
  className?: string;
}) {
  const resolved = message || getHttpErrorMessage(status);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl border border-border bg-card/40 px-6 py-14",
        className
      )}
      role="alert"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {status ? (
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">Error {status}</p>
      ) : null}
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{resolved}</p>
      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        )}
        {!onRetry && !onRefresh && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Refresh page
          </Button>
        )}
      </div>
    </div>
  );
}
