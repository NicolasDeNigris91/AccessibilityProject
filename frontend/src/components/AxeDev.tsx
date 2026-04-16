"use client";
import { useEffect } from "react";

// Dev-only accessibility checker. @axe-core/react is an optional dev dep:
// run `npm --workspace frontend i -D @axe-core/react` to activate.
export function AxeDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const React = await import("react");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ReactDOM: any = await import("react-dom" as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const axeMod: any = await import("@axe-core/react" as string);
        if (cancelled) return;
        const axe = axeMod.default ?? axeMod;
        axe(React, ReactDOM, 1000);
      } catch {
        // axe not installed — skip silently
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
