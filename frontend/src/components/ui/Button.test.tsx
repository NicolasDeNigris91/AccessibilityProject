import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("applies primary variant by default", () => {
    render(<Button>Auditar</Button>);
    const btn = screen.getByRole("button", { name: "Auditar" });
    expect(btn.className).toMatch(/bg-brand/);
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole("button").className).toMatch(/border/);
  });
});
