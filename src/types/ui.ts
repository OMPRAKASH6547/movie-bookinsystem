/**
 * Loose API/UI record for dashboard pages.
 * Prefer tightening per-page as shapes stabilize.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = any;

export type ApiError = {
  response?: { data?: { message?: string }; status?: number };
  message?: string;
};

export function apiErrorMessage(err: unknown, fallback = "Something went wrong") {
  const e = err as ApiError;
  return e?.response?.data?.message || e?.message || fallback;
}
