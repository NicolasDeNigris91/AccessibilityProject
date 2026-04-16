import { calculateScore, countBySeverity } from "./scoring";
import { Violation } from "./types";

const v = (impact: Violation["impact"], nodes = 1): Violation => ({
  id: "x",
  impact,
  description: "",
  helpUrl: "",
  tags: [],
  nodes: Array.from({ length: nodes }, () => ({ target: [], html: "" })),
});

describe("calculateScore", () => {
  it("returns 100 when there are no violations", () => {
    expect(calculateScore([])).toBe(100);
  });

  it("subtracts weighted penalties with log-scaled node factor", () => {
    // penalty = weight * (1 + log10(nodes)); rounded to nearest int
    // critical*1 (10) + serious*2 (~6.5) + moderate*1 (2) + minor*3 (~1.48) ≈ 19.98 → score 80
    const violations = [v("critical"), v("serious", 2), v("moderate"), v("minor", 3)];
    expect(calculateScore(violations)).toBe(80);
  });

  it("clamps to 0 when penalties exceed 100", () => {
    expect(calculateScore(Array.from({ length: 20 }, () => v("critical")))).toBe(0);
  });

  it("counts severities correctly across nodes", () => {
    const totals = countBySeverity([v("critical", 2), v("minor", 5)]);
    expect(totals).toEqual({ critical: 2, serious: 0, moderate: 0, minor: 5 });
  });
});
