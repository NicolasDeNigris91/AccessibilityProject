import express from "express";
import request from "supertest";
import { requestId } from "./requestId";

function buildApp() {
  const app = express();
  app.use(requestId);
  app.get("/echo", (req, res) => {
    res.json({ requestId: req.requestId });
  });
  return app;
}

describe("requestId middleware", () => {
  it("mints a UUID when no X-Request-Id is sent", async () => {
    const res = await request(buildApp()).get("/echo");
    expect(res.status).toBe(200);
    expect(res.body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(res.headers["x-request-id"]).toBe(res.body.requestId);
  });

  it("reuses an incoming X-Request-Id of reasonable length", async () => {
    const res = await request(buildApp())
      .get("/echo")
      .set("X-Request-Id", "upstream-abc-123");
    expect(res.body.requestId).toBe("upstream-abc-123");
    expect(res.headers["x-request-id"]).toBe("upstream-abc-123");
  });

  it("rejects a too-long incoming X-Request-Id and mints a fresh one", async () => {
    const hostile = "a".repeat(500);
    const res = await request(buildApp()).get("/echo").set("X-Request-Id", hostile);
    expect(res.body.requestId).not.toBe(hostile);
    expect(res.body.requestId.length).toBeLessThanOrEqual(100);
  });

  it("falls back to UUID for an empty incoming header", async () => {
    const res = await request(buildApp()).get("/echo").set("X-Request-Id", "");
    expect(res.body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it("produces different ids on two independent requests", async () => {
    const app = buildApp();
    const [a, b] = await Promise.all([
      request(app).get("/echo"),
      request(app).get("/echo"),
    ]);
    expect(a.body.requestId).not.toBe(b.body.requestId);
  });
});
