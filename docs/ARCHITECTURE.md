# System Design

## Data flow

```
   Browser (Next.js dashboard)
        │
        │  1. POST /api/audits {url}
        ▼
   ┌──────────────┐    2. validate (zod) + create Audit{status:"queued"}
   │   API (Node) │ ──────────────────────────────► MongoDB
   │   Express    │    3. enqueue {publicId,url}
   └──────┬───────┘ ──────────────────────────────► Redis (BullMQ)
          │                                           │
          │  202 {publicId}                           │
          ▼                                           ▼
   Browser polls GET /api/audits/:id          ┌──────────────┐
          ▲                                    │   Worker     │
          │                                    │  (Node, sep. │
          │                                    │   process)   │
          │                                    └──────┬───────┘
          │                                           │ 4. Puppeteer.launch (reused)
          │                                           │ 5. page.goto(url) + inject axe-core
          │                                           │ 6. axe.run() → violations
          │                                           │ 7. screenshot per violation node
          │                                           ▼
          │                                    Local volume (/screenshots)
          │                                           │
          │   8. update Audit{status:"done", score, totals, violations[]}
          └──────────────────────────────────► MongoDB
```

## Process topology

Two long-running Node processes built from the same image:

- **api** (`ROLE=api`) — stateless, horizontally scalable, no Puppeteer.
- **worker** (`ROLE=worker`) — owns Puppeteer; concurrency capped by `MAX_CONCURRENT_AUDITS`. Scale by adding worker replicas.

Plus **mongo**, **redis**, **frontend**.

## Resilience

| Failure mode               | Mitigation                                              |
| -------------------------- | ------------------------------------------------------- |
| Puppeteer crash            | `disconnected` listener → relaunch on next job          |
| Page hangs                 | `AUDIT_TIMEOUT_MS` on `page.goto`                       |
| Worker OOM / killed        | BullMQ re-queues unfinished job (visibility timeout)    |
| Job throws                 | 2 attempts, exponential backoff, then `status:"failed"` |
| Bad input URL              | zod validation at HTTP boundary                         |
| Abuse / DoS                | `express-rate-limit` + body size cap                    |
| Mongo / Redis briefly down | Boot retries; `/health` reports `degraded`              |

## Why Clean Architecture here

`domain/` is pure (`scoring`, `types`) → trivially unit-tested without booting Mongo, Redis, or Chromium. Swap Puppeteer for Playwright, or BullMQ for SQS, by replacing one folder under `infrastructure/` — interfaces stay stable.
