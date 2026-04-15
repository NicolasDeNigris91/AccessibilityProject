import type { ReactNode } from "react";

type Severity = "critical" | "serious" | "moderate" | "minor" | "pass";

interface BadgeProps {
  severity?: Severity;
  children: ReactNode;
  className?: string;
}

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: "bg-severity-critical text-white",
  serious: "bg-severity-serious text-white",
  moderate: "bg-severity-moderate text-white",
  minor: "bg-severity-minor text-white",
  pass: "bg-severity-pass text-white",
};

export function Badge({ severity, children, className = "" }: BadgeProps) {
  const sev = severity ? SEVERITY_CLASS[severity] : "bg-line text-ink";
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${sev} ${className}`}
    >
      {children}
    </span>
  );
}
