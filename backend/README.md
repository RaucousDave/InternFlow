# Backend — your build (Express + TypeScript + Drizzle + better-auth)

PostgreSQL lives on **NeonDB** (no local container): set `DATABASE_URL` in `.env`.

## Setup

```bash
npm install
cp .env.example .env   # Neon DATABASE_URL + BETTER_AUTH_SECRET
npm run db:generate && npm run db:migrate
npm run db:seed        # TODO: implement seed first
npm run dev            # → http://localhost:8000
```

## Your task list (maps to PRD)

1. `src/auth.ts` — review the better-auth instance (email+password, 7-day sessions).
2. `src/middleware/auth.ts` — session → `req.user` incl. DB role + profile ids (401 otherwise).
3. `GET /api/me` in `src/index.ts` — return `{ role, email }` for the frontend.
4. `routes/student.ts` — profile (incl. reg-number regex + 409s + student-row creation),
   placement, logbook CRUD + submit with ownership checks, week uniqueness (409),
   submit locking (403).
5. `routes/supervisor.ts` — role gate, student reads, review + feedback,
   completion gate (422 when requirements unmet).
6. `db/seed.ts` — department supervisor account (`SUPERVISOR`, server-set only).
7. Error handler returning `{ error, code }`.

## Contract with the frontend (do not break silently)

- Auth endpoints are better-auth's (`/api/auth/sign-up/email`, `/sign-in/email`,
  `/sign-out`, `/get-session`); everything else exactly as in `DESIGN.md` §4.
- Frontend sends cookies (`credentials: include`); keep CORS open for
  `http://localhost:5173` with credentials.
- Role comes from the DB only; the frontend caches it from `/api/me` for routing.
- Key codes the frontend handles: `400` validation, `401` auth,
  `403` forbidden/locked, `404` missing, `409` duplicate, `422` completion blocked.
- Final-report module is OUT of the MVP (completion = profile + placement +
  required reviewed weeks).
