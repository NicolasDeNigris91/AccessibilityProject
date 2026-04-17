/**
 * @jest-environment jsdom
 */
import { apiFetch, fetcher } from "./api";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("euthus-client-id", "550e8400-e29b-41d4-a716-446655440000");
  });

  it("adds X-Client-Id header on GET", async () => {
    const mock = jest.fn().mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    global.fetch = mock as unknown as typeof fetch;

    await apiFetch("https://api.example.com/x");

    const [, init] = mock.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("x-client-id")).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("preserves caller-provided headers on POST", async () => {
    const mock = jest.fn().mockResolvedValue(new Response("{}", { status: 202 }));
    global.fetch = mock as unknown as typeof fetch;

    await apiFetch("https://api.example.com/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const [, init] = mock.mock.calls[0];
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-client-id")).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(init.method).toBe("POST");
  });
});

describe("fetcher", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("euthus-client-id", "550e8400-e29b-41d4-a716-446655440000");
  });

  it("returns parsed JSON on 2xx", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    ) as unknown as typeof fetch;

    await expect(fetcher<{ ok: boolean }>("https://api.example.com/x")).resolves.toEqual({
      ok: true,
    });
  });

  it("throws on non-2xx", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response("nope", { status: 400 })
    ) as unknown as typeof fetch;

    await expect(fetcher("https://api.example.com/x")).rejects.toThrow("API error 400");
  });
});
