export type WcagSeverity = "critical" | "serious" | "moderate" | "minor";

export interface ViolationNode {
  target: string[];
  html: string;
  failureSummary?: string;
}

export interface Violation {
  id: string;
  impact: WcagSeverity;
  description: string;
  helpUrl: string;
  tags: string[];
  nodes: ViolationNode[];
}

export interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface AuditResult {
  url: string;
  score: number;
  totals: SeverityCounts;
  violations: Violation[];
  passes: number;
  durationMs: number;
}
