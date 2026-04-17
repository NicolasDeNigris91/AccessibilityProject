import { ApiError } from "./api";
import type { AuditDetail } from "./types";

export type AuditViewState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error" }
  | { kind: "queued"; data: AuditDetail }
  | { kind: "running"; data: AuditDetail }
  | { kind: "failed"; data: AuditDetail }
  | { kind: "done"; data: AuditDetail };

export function deriveAuditState(
  data: AuditDetail | undefined,
  error: unknown,
  isLoading: boolean
): AuditViewState {
  if (data) return { kind: data.status, data };
  if (error instanceof ApiError && error.status === 404) return { kind: "not-found" };
  if (error) return { kind: "error" };
  if (isLoading) return { kind: "loading" };
  return { kind: "loading" };
}

export const AUDIT_POLL_MS = 3000;

export function pollingIntervalFor(data: AuditDetail | undefined): number {
  if (!data) return 0;
  if (data.status === "done" || data.status === "failed") return 0;
  return AUDIT_POLL_MS;
}
