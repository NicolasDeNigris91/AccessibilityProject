import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

const HEADER = "x-request-id";
const MAX_INCOMING_LENGTH = 100;

/**
 * Tag every request with a stable id. Reuses a client-supplied X-Request-Id when
 * it is a reasonable length (defends against a client stuffing logs with MB-sized
 * values) and otherwise mints a fresh UUID. The same id is echoed back in the
 * response header so callers can correlate their own traces.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header(HEADER);
  const id =
    incoming && incoming.length > 0 && incoming.length <= MAX_INCOMING_LENGTH
      ? incoming
      : randomUUID();
  req.requestId = id;
  res.setHeader(HEADER, id);
  next();
};
