import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

const HEADER = "x-request-id";
const MAX_INCOMING_LENGTH = 100;

// Reuse a sane client-supplied X-Request-Id, otherwise mint one. Length cap
// keeps a hostile client from filling logs with huge values.
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
