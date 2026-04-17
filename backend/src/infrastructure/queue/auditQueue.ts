import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export interface AuditJobData {
  publicId: string;
  url: string;
  // Propagated from the HTTP layer so worker logs and DB audit trails share a
  // single correlation id with the request that enqueued the job.
  requestId?: string;
}

export const AUDIT_QUEUE = "audits";

export const auditQueue = new Queue<AuditJobData>(AUDIT_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
});
