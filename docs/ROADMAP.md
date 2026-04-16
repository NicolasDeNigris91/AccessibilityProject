# Development Roadmap — Incremental Build

Build the system in vertical slices. Each phase is shippable and demoable on its own.

---

## Phase 0 — Foundations (½ day)

- [ ] Init monorepo, root `package.json` workspaces, `.gitignore`, `.env.example`.
- [ ] Backend `tsconfig`, ESLint, Prettier, Jest config.
- [ ] Pino logger + zod-validated `config/env.ts`.
- [ ] `GET /health` returning `{status:"ok"}`.

**Exit criteria:** `npm run dev:backend` boots, `/health` returns 200.

---

## Phase 1 — Domain Core + Tests (½ day)

- [ ] `domain/types.ts`, `domain/scoring.ts`.
- [ ] Jest unit tests for `calculateScore` (boundary cases: empty, clamped to 0/100, weighted sums).
- [ ] CI script: `npm test`.

**Exit criteria:** `npm test` green with >90% coverage on `domain/`.

---

## Phase 2 — Synchronous MVP Audit (1 day)

- [ ] Install Puppeteer + axe-core locally (no Docker yet).
- [ ] `POST /api/audits` runs Puppeteer **inline** (blocking) and returns the JSON.
- [ ] Mongo connection + `AuditModel`; persist result.
- [ ] `GET /api/audits/:id` and `GET /api/audits` (history).

**Exit criteria:** Demo: `curl -X POST … {url:"https://example.com"}` returns score + violations.

---

## Phase 3 — Async Queue (1 day)

- [ ] Add Redis (`docker run` for now).
- [ ] BullMQ `auditQueue`, `auditWorker.ts` — move Puppeteer logic out of HTTP handler.
- [ ] `POST` returns `202 + publicId`; client polls `GET /api/audits/:publicId` until `status:"done"`.
- [ ] Concurrency cap via `MAX_CONCURRENT_AUDITS`.
- [ ] Browser instance reuse + auto-reconnect on `disconnected`.

**Exit criteria:** API process never blocks on Puppeteer; killing the worker doesn't kill the API.

---

## Phase 4 — Hardening (½ day)

- [ ] `helmet`, `express-rate-limit`, body size limits.
- [ ] Central `errorHandler` + `AppError` taxonomy.
- [ ] URL validation (zod) + audit timeout.
- [ ] Structured request logs (`pino-http`).
- [ ] Job retries with exponential backoff; `failed` status persisted with error message.

**Exit criteria:** Hammer with `ab` / `wrk` — API stays responsive, rate limiter trips, no crashes.

---

## Phase 5 — Screenshots (½ day)

- [ ] Per-violation node screenshot via `elementHandle.screenshot()`.
- [ ] Persist relative path on the violation node.
- [ ] Static-serve `/screenshots/*` (read-only).

**Exit criteria:** Audit detail JSON includes `screenshotPath` per node.

---

## Phase 6 — Documentation (¼ day)

- [ ] `swagger-jsdoc` + `swagger-ui-express` mounted at `/docs`.
- [ ] JSDoc `@openapi` annotations on all routes.
- [ ] `GET /openapi.json` for tooling.

**Exit criteria:** `/docs` renders, all endpoints listed with example payloads.

---

## Phase 7 — Frontend Dashboard (1–2 days)

- [ ] Next.js app, Tailwind, SWR.
- [ ] Submit form → polling list with score badges (color-coded).
- [ ] Audit detail page: severity tiles, violation list, screenshots, axe `helpUrl`.
- [ ] **Color-blindness simulator**: SVG `feColorMatrix` filters + `<select>` toggle on `<html>`.

**Exit criteria:** End-to-end flow in browser; share-by-URL works (`/audits/:publicId`).

---

## Phase 8 — Full Dockerization (½ day)

- [ ] `backend/Dockerfile` (multi-stage; system Chromium; runs as non-root; `dumb-init`).
- [ ] `frontend/Dockerfile` (multi-stage Next.js).
- [ ] `docker-compose.yml`: `mongo`, `redis`, `api`, `worker` (same image, `ROLE=worker`), `frontend`.
- [ ] `shm_size: 1gb` on the worker for Chromium stability.
- [ ] Persistent `mongo_data` volume; `screenshots` volume mounted into worker + api.

**Exit criteria:** `docker compose up --build` from a clean clone gives a fully working stack.

---

## Phase 9 — Observability & Polish (optional, ½ day)

- [ ] BullMQ Bull-Board UI mounted at `/admin/queues` (basic-auth gated).
- [ ] `/health` extended: mongo ping, redis ping, queue depth.
- [ ] Prometheus metrics (`prom-client`) + `/metrics` endpoint.
- [ ] GitHub Actions: lint + test on PR; build & push image on `main`.

**Exit criteria:** CI green badge on README; metrics scrapable.

---

## Suggested order of commits

`chore: monorepo skeleton` → `feat(domain): scoring + tests` → `feat(api): sync audit MVP` →
`feat(queue): bullmq worker` → `feat(api): hardening` → `feat(worker): screenshots` →
`docs(api): swagger` → `feat(frontend): dashboard + cb simulator` → `chore(docker): compose stack`.
