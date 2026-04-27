import { SeverityCounts, Violation, WcagSeverity } from "./types";

const WEIGHTS: Record<WcagSeverity, number> = {
  critical: 10,
  serious: 5,
  moderate: 2,
  minor: 1,
};

export function countBySeverity(violations: Violation[]): SeverityCounts {
  const totals: SeverityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    const n = v.nodes.length || 1;
    totals[v.impact] += n;
  }
  return totals;
}

/**
 * Compute a 0-100 accessibility score.
 * Pure function, fully unit-testable, no I/O.
 */
export function calculateScore(violations: Violation[]): number {
  let penalty = 0;
  for (const v of violations) {
    const base = WEIGHTS[v.impact];
    const nodeFactor = 1 + Math.log10(Math.max(1, v.nodes.length));
    penalty += base * nodeFactor;
  }
  const score = 100 - penalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}
