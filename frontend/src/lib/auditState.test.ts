import { ApiError } from "./api";
import { AUDIT_POLL_MS, deriveAuditState, pollingIntervalFor } from "./auditState";
import type { AuditDetail, AuditStatus } from "./types";

const baseAudit: AuditDetail = {
  publicId: "abc",
  url: "https://example.com",
  status: "queued",
  createdAt: "2026-04-17T00:00:00.000Z",
  violations: [],
};

const withStatus = (status: AuditStatus): AuditDetail => ({ ...baseAudit, status });

describe("deriveAuditState", () => {
  it("returns loading when no data, no error, and still loading", () => {
    expect(deriveAuditState(undefined, undefined, true)).toEqual({ kind: "loading" });
  });

  it("returns loading as the safe default when nothing resolved yet", () => {
    expect(deriveAuditState(undefined, undefined, false)).toEqual({ kind: "loading" });
  });

  it("maps ApiError 404 to not-found", () => {
    expect(deriveAuditState(undefined, new ApiError(404), false)).toEqual({
      kind: "not-found",
    });
  });

  it("maps other ApiError codes to generic error", () => {
    expect(deriveAuditState(undefined, new ApiError(500), false)).toEqual({ kind: "error" });
  });

  it("maps non-API errors (network, parse) to generic error", () => {
    expect(deriveAuditState(undefined, new Error("boom"), false)).toEqual({ kind: "error" });
  });

  it("prefers data over stale error (stale-while-revalidate)", () => {
    const data = withStatus("running");
    expect(deriveAuditState(data, new Error("transient blip"), false)).toEqual({
      kind: "running",
      data,
    });
  });

  it.each<AuditStatus>(["queued", "running", "failed", "done"])(
    "mirrors audit status %s into the view state",
    (status) => {
      const data = withStatus(status);
      expect(deriveAuditState(data, undefined, false)).toEqual({ kind: status, data });
    }
  );
});

describe("pollingIntervalFor", () => {
  it("does not poll before the first response resolves", () => {
    expect(pollingIntervalFor(undefined)).toBe(0);
  });

  it.each<AuditStatus>(["queued", "running"])("polls while audit is %s", (status) => {
    expect(pollingIntervalFor(withStatus(status))).toBe(AUDIT_POLL_MS);
  });

  it.each<AuditStatus>(["done", "failed"])("stops polling once audit is %s", (status) => {
    expect(pollingIntervalFor(withStatus(status))).toBe(0);
  });
});
