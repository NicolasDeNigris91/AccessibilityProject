import { ErrorRequestHandler } from "express";
import { logger } from "@/config/logger";

export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal_server_error" });
};
