# TPC frontend

React/Vite/TypeScript website and installable PWA. Run commands from this folder:

```powershell
cd C:\Code\TPC\frontend
npm ci
npm run dev
```

Open http://localhost:3000 and run the [backend](../backend/README.md) in another terminal. Vite proxies `/api` to http://127.0.0.1:4000. Optional `FRONTEND_PORT` and `API_TARGET` settings belong in `frontend/.env`; see `.env.example`. Browser requests use relative API paths so cookies share the site's origin.

## Commands

```powershell
npm run check
npm run build
npm run preview
npm run test:e2e
npm run format:check
```

The browser suite requires `E2E_DATABASE_URL` in `backend/.env` pointing to a separate disposable PostgreSQL database, and starts both apps on ports 3001/4001. It covers member, business and admin flows, mobile navigation and authentication throttling. Install dependencies in both packages first. Tests use installed Microsoft Edge on Windows; elsewhere run `npx playwright install chromium`. Failure traces go in ignored `test-results`.

`src/pages` groups public, member, business and admin screens. Shared UI lives in `src/components`, API requests in `src/api`, session state in `src/context`, and helpers in `src/utils` and `src/hooks`. `public` contains local photos, app icons, the manifest and offline service worker. Keep database credentials and server authentication in the backend.

Build output is `dist`. Build the standalone Nginx image with `docker build -t tpc-frontend .` from this folder. Nginx serves application routes and proxies `/api` to `backend:4000`. Production must serve the app and API under the same HTTPS origin set as the backend's `APP_URL`. See [project documentation](../docs/README.md) and [design research](../docs/design.md).
