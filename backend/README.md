# TPC backend

Express/TypeScript API with PostgreSQL, Drizzle ORM and Better Auth. Run commands from this folder:

```powershell
cd C:\Code\TPC\backend
npm ci
npm run dev
```

The API listens on http://localhost:4000. Start the [frontend](../frontend/README.md) in another terminal and browse http://localhost:3000. Optional settings belong in `backend/.env`; copy `.env.example` to get started. `APP_URL` is the browser-facing origin and `PORT` is the API port.

Development connects to your existing PostgreSQL server using `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tpc` in `backend/.env`. No embedded database is started. Startup applies migrations and seeds missing demo records. The local admin is `admin` / `123`; seeding never resets an existing password.

## Commands

```powershell
npm run check
npm test
npm run build
npm start
npm run test:production
npm run format:check
```

`npm test` requires `TEST_DATABASE_URL` pointing to a separate disposable PostgreSQL database: tests reset its public and drizzle schemas. `test:production` requires a fresh separate database in `SMOKE_DATABASE_URL`. Browser flows require `E2E_DATABASE_URL`. Install frontend dependencies first.

## Code and database

- `src/app.ts` assembles the HTTP app; `src/routes` groups endpoints by audience.
- `src/http` owns authentication middleware, HTTP configuration and error responses.
- `src/services` owns venue access and capacity-controlled reservations.
- `src/database/schema.ts` declares Drizzle tables; `src/database/users.ts` owns account/profile changes, business promotion, account access and seed credentials.
- `src/auth.ts` configures Better Auth's Drizzle adapter; password hashing and sessions remain Better Auth operations.
- `drizzle` contains versioned SQL migrations and schema snapshots.
- `src/paths.ts` loads `.env` from this package.

After editing the schema, generate and review SQL, then apply it:

```powershell
npm run db:generate -- --name describe_change
npm run db:migrate
# Migrate and seed missing records:
npm run db:setup
```

The initial migration adopts the original table names without replacing IDs, password hashes, sessions, profiles or bookings. Keep the same `BETTER_AUTH_SECRET` when moving an existing deployment to preserve signed sessions. Startup applies pending migrations under an advisory lock.

Build the standalone image with `docker build -t tpc-backend .` from this folder. Production requires `DATABASE_URL`, `APP_URL`, a strong `BETTER_AUTH_SECRET` and an initial `SEED_ADMIN_PASSWORD` of at least 12 characters. See [project and deployment documentation](../docs/README.md).
