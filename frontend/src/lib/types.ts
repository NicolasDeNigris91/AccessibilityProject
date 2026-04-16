export type Severity = "critical" | "serious" | "moderate" | "minor";
export type AuditStatus = "queued" | "running" | "done" | "failed";

export interface SeverityTotals {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface ViolationNode {
  target?: string[];
  html?: string;
  failureSummary?: string;
}

export interface Violation {
  id: string;
  impact: Severity;
  description: string;
  helpUrl: string;
  tags?: string[];
  nodes: ViolationNode[];
}

export interface AuditSummary {
  publicId: string;
  url: string;
  status: AuditStatus;
  score?: number;
  totals?: SeverityTotals;
  createdAt: string;
}

export interface AuditDetail extends AuditSummary {
  violations: Violation[];
}
