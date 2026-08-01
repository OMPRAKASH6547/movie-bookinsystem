"use client";

import { ErrorState, getHttpErrorMessage } from "@/components/loading/error-state";
import { EmptyState, type EmptyVariant } from "@/components/loading/empty-state";

export function DataState({
  loading,
  error,
  errorStatus,
  isEmpty,
  emptyVariant = "generic",
  emptyTitle,
  emptyDescription,
  skeleton,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: unknown;
  errorStatus?: number;
  isEmpty?: boolean;
  emptyVariant?: EmptyVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  skeleton: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <>{skeleton}</>;

  if (error) {
    const status =
      errorStatus ||
      (error as { response?: { status?: number } })?.response?.status;
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || getHttpErrorMessage(status);
    return (
      <ErrorState
        status={status}
        message={message}
        onRetry={onRetry}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        variant={emptyVariant}
        title={emptyTitle}
        description={emptyDescription}
        onAction={onRetry}
        actionLabel={onRetry ? "Retry" : undefined}
      />
    );
  }

  return <>{children}</>;
}
