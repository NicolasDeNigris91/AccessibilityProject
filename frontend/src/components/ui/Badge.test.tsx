import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders critical severity with correct color class", () => {
    render(<Badge severity="critical">Crítica</Badge>);
    const el = screen.getByText("Crítica");
    expect(el.className).toMatch(/severity-critical|bg-severity-critical/);
  });
});
