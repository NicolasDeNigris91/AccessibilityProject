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
| Mongo / Redis briefly down | Boot retries; `/ready` reports `degraded` (load balancer stops routing); `/health` stays 200 so the container is not restarted |
| Worker redeploy during job | `SIGTERM` drains in flight jobs with a 25s timeout; jobs that do not finish are force-closed and re-queued by BullMQ |

## Why Clean Architecture here

`domain/` is pure (`scoring`, `types`) → trivially unit-tested without booting Mongo, Redis, or Chromium. Swap Puppeteer for Playwright, or BullMQ for SQS, by replacing one folder under `infrastructure/` — interfaces stay stable.

## Authorization model

There is no user concept and no authentication secret. Every browser mints a UUID the first time it loads the app, stores it in `localStorage`, and sends it on every request as `X-Client-Id`. That header is the ownership key for the `GET /api/audits` list and for the `POST /api/audits` create.

Consequences worth naming:

- `GET /api/audits/:publicId` is **public**. An audit's `publicId` is a UUID; knowing it is sufficient to read the report. This is deliberate — reports are designed to be shareable by URL.
- `X-Client-Id` is **not a secret**. A client can send any UUID. Impersonating another client's list requires guessing their UUID (2^122 bits of entropy) or scraping it from their browser, at which point the attacker already has the original session.
- There is no privilege escalation to worry about: audits have no PII beyond the URL the user entered.

If the product later needs proper user accounts, this layer gets replaced with authenticated sessions or tokens; the worker, domain, and queue stay unchanged.

## Error contract

Every error response uses the same envelope:

```json
{
  "error": { "code": "unsafe_target", "message": "unsafe_target" },
  "requestId": "0b4d2f1e-1a9c-4b2c-9a37-1f5d84e1b3a2"
}
```

`code` is stable and machine-readable. `message` is human-facing (often the same as the code for short tokens). `requestId` is set by the `requestId` middleware, returned in the `X-Request-Id` response header, propagated into BullMQ job data, and attached to every log line the worker emits for that job. Give us a `requestId` and we can replay the full HTTP-to-worker timeline in the logs.

## SSRF defense

The audit worker navigates user-supplied URLs in a real browser, so the API has a three-layer guard in front of Puppeteer. The classifier in `domain/urlSafety` allows only public unicast ranges. The async `application/assertSafeUrl` resolves DNS at intake and rejects any target with a non-public address. The worker repeats the check before `page.goto` (DNS could drift between enqueue and dequeue) and a Puppeteer request interceptor aborts any sub-request whose hostname is a literal private IP (catches redirect-based exfiltration).

Known residual risk: a DNS name whose record flips to a private IP between intake and an in-page sub-request can still slip past the sync interceptor. Closing it fully requires a DNS-aware egress proxy or a network-namespaced worker.
