import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { connectMongo } from "@/infrastructure/db/mongo";
import { AuditModel } from "@/infrastructure/db/AuditModel";
import { redisConnection } from "@/infrastructure/queue/connection";
import { auditsRouter } from "@/interfaces/http/routes/audits";
import { errorHandler } from "@/interfaces/http/middlewares/errorHandler";
import { mountSwagger } from "@/interfaces/http/swagger";

async function main() {
  await connectMongo();
  await AuditModel.syncIndexes();

  const app = express();

  // Railway (and most PaaS) sit behind a reverse proxy — required so Express
  // reads the real client IP from X-Forwarded-For (used by rate-limit) instead
  // of treating every request as coming from the proxy's IP.
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(
    helmet({
      // Swagger UI needs inline styles/scripts; scoped CSP is configured per-route below.
      contentSecurityPolicy: false,
    })
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Liveness + readiness probe
   *     tags: [System]
   *     responses:
   *       200: { description: OK }
   */
  app.get("/health", async (_req, res) => {
    const redisOk = (await redisConnection.ping().catch(() => null)) === "PONG";
    res.status(redisOk ? 200 : 503).json({
      status: redisOk ? "ok" : "degraded",
      redis: redisOk,
      uptime: process.uptime(),
    });
  });

  app.use("/api/audits", auditsRouter);
  mountSwagger(app);
  app.use(errorHandler);

  app.listen(env.PORT, () => logger.info({ port: env.PORT }, "api listening"));
}

main().catch((err) => {
  logger.fatal({ err }, "api boot failed");
  process.exit(1);
});
