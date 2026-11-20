# The Third Place Collective

A website and installable web app for small gatherings at South African venues. React, Vite and TypeScript power the frontend; Express, Better Auth, Drizzle ORM and PostgreSQL power the backend.

The repo is at **`C:\Code\TPC`**. Its root contains three folders:

```text
backend/   API, database, migrations, API tests and production smoke test
frontend/  Website, PWA, browser tests and static assets
docs/      Project notes, design research, deployment files and original Word documents
```

Each app has its own dependencies, lockfile, configuration and build. There is no root npm workspace. Original Word documents are preserved in [reference](reference/); design research is in [design.md](design.md) and image sources in [assets.md](assets.md).

## Run locally

Use Node.js 22.12+ and npm. Open two terminals:

```powershell
cd C:\Code\TPC\backend
npm ci
npm run dev
```

```powershell
cd C:\Code\TPC\frontend
npm ci
npm run dev
```

Browse **http://localhost:3000**. The frontend proxies `/api` to port 4000. Set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tpc` in `backend/.env`. The backend connects to your existing PostgreSQL server, migrates the schema and inserts missing demo records. No embedded database is started. Stop development with Ctrl+C in each terminal. Optional environment files belong inside their app folder; see each `.env.example`.

| Account         | Username | Password          | Portal      |
| --------------- | -------- | ----------------- | ----------- |
| Administrator   | `admin`  | `123`             | `/admin`    |
| Sample business | `host`   | `HostDemo2026!`   | `/business` |
| Sample member   | `member` | `MemberDemo2026!` | `/my`       |

Passwords are hashed by Better Auth. Repeated seeding preserves existing passwords. Change a password through My account → My profile.

## Flows

- Public: home, story, business introduction, gathering search/filtering, event details and directions.
- Members: signup, username/email login, profiles/interests, saved events, capacity-controlled RSVP, calendar download, plans, cancellation and password changes.
- Businesses: venue application, edits/resubmission, event drafts, review submissions, guest lists, check-in and event cancellation.
- Administrators: venue/event approval and rejection with feedback, platform totals, account enable/disable, session revocation and moderation audit history.
- PWA: responsive screens, mobile navigation, install manifest/icons and an offline reconnect screen. Use Install app in My profile or the browser menu; on iPhone use Safari's Share → Add to Home Screen. HTTPS is required outside localhost.

Venue edits return the venue to review. Discovery includes approved events at approved venues. Published gatherings can be cancelled; editing requires a draft. Dates use South Africa time. RSVP transactions lock event rows to prevent overselling; duplicate RSVPs are idempotent.

## Verification and code

From `backend`, run `npm test` for API/migration tests, `npm run test:production` for compiled-app/PWA checks, and `npm run build` for an API build. From `frontend`, run `npm run test:e2e` for browser flows and `npm run build` for a frontend build. Both folders provide `npm run check`, `npm run format` and `npm run format:check`.

Tests require separate disposable PostgreSQL databases in `TEST_DATABASE_URL` (API/migrations), `E2E_DATABASE_URL` (browser flows), and `SMOKE_DATABASE_URL` (production smoke). API tests reset their public and drizzle schemas. Browser tests use installed Edge on Windows or Playwright Chromium elsewhere.

See [backend instructions](../backend/README.md) for Drizzle migration commands and [frontend instructions](../frontend/README.md) for UI structure. Routes and pages are grouped by audience; shared components, HTTP middleware, reservation logic and user management have separate modules. Prefer descriptive names, small functions and explicit types; format changes with Prettier.

## Deployment

Deployment files live in [deployment](deployment/). For Docker Compose, put these values in `backend/.env`:

```dotenv
APP_URL=https://your-domain.example
BETTER_AUTH_SECRET=YOUR_RANDOM_SECRET_WITH_AT_LEAST_32_CHARACTERS
SEED_ADMIN_PASSWORD=YOUR_INITIAL_ADMIN_PASSWORD_WITH_AT_LEAST_12_CHARACTERS
POSTGRES_PASSWORD=YOUR_DATABASE_PASSWORD
```

From `C:\Code\TPC`, with Docker running:

```powershell
docker compose --env-file backend/.env -f docs/deployment/compose.yaml up -d --build
```

Compose runs PostgreSQL, the API and Nginx in separate services. Only the frontend is bound to localhost:3000; configure HTTPS in front of it using [the reverse-proxy example](deployment/nginx.conf.example). Configure backups and monitor `/api/health`. Production startup requires a database URL, a strong auth secret and an initial admin password of at least 12 characters. It seeds only the admin on a fresh production database. Existing passwords are never overwritten. Replace development demo data and credentials before exposing an existing development database.

Without Docker, provision PostgreSQL and set `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_SECRET` and `SEED_ADMIN_PASSWORD` for the backend. Install/build each app in its own folder, serve `frontend/dist`, supervise `npm start` in `backend`, and route `/api` to it. Run `npm run db:migrate` in the backend as a release step. Use a shared rate-limit store before scaling to multiple API processes.

## Current scope

This local MVP is an installable PWA. Native store binaries, paid tickets, membership billing/discounts, push notifications, chat and matching remain deferred. Reservations are free; venue purchases are separate. Email delivery, email verification and account recovery are not configured, and the sign-in/privacy screens state this. Connect those services and establish support and retention procedures before public launch. The app has not been deployed to a hosting account.

## Next Steps

Include Whatsapp integration for sharing links and events.
Notification services for PWA
Add a way to create an event at a place, the place doesnt need to be on the app.
