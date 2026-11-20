import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { connectDatabase } from '../src/db';
import { backendRoot, workspaceRoot } from '../src/paths';

// Use an explicitly configured disposable PostgreSQL database.
const smokeDatabaseUrl = process.env.SMOKE_DATABASE_URL;
if (!smokeDatabaseUrl)
  throw new Error('SMOKE_DATABASE_URL is required; use a separate disposable PostgreSQL database.');
process.env.TEST_DATABASE_URL = smokeDatabaseUrl;
const db = await connectDatabase(true);
const base = 'http://localhost:3002';
const child = spawn(process.execPath, [path.join(backendRoot, 'dist/index.js')], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '4002',
    APP_URL: base,
    DATABASE_URL: smokeDatabaseUrl,
    BETTER_AUTH_SECRET: randomBytes(32).toString('base64'),
    SEED_ADMIN_PASSWORD: 'SmokeTestAdmin2026!',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
const frontend = spawn(
  process.execPath,
  [
    path.join(workspaceRoot, 'frontend/node_modules/vite/bin/vite.js'),
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '3002',
    '--strictPort',
  ],
  {
    cwd: path.join(workspaceRoot, 'frontend'),
    env: { ...process.env, API_TARGET: 'http://127.0.0.1:4002' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);
let logs = '';
child.stdout.on('data', (data) => {
  logs += String(data);
});
child.stderr.on('data', (data) => {
  logs += String(data);
});
frontend.stdout.on('data', (data) => {
  logs += String(data);
});
frontend.stderr.on('data', (data) => {
  logs += String(data);
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) {
        ready = true;
        break;
      }
    } catch {}
    if (child.exitCode !== null || frontend.exitCode !== null)
      throw new Error('Production process exited: ' + logs);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, 'Production server did not become ready: ' + logs);
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  browser = await chromium.launch(existsSync(edge) ? { executablePath: edge } : {});
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy|Refused to/.test(message.text()))
      errors.push(message.text());
  });
  await page.goto(base);
  await page.getByRole('heading', { name: 'Your people. Your city. Your third place.' }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const manifest = await (await context.request.get(base + '/manifest.webmanifest')).json();
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const response = await context.request.get(base + icon.src);
    assert.equal(response.status(), 200);
    assert.ok(response.headers()['content-type'].includes('image/png'));
  }
  await page.goto(base + '/login?next=/admin');
  await page.getByLabel('Email or username').fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('SmokeTestAdmin2026!');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('heading', { name: 'Keep the good things going.' }).waitFor();
  // Verify narrow phones in the actual production CSS as well.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(base);
  const layout = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= innerWidth,
    wide: Array.from(document.querySelectorAll('body *'))
      .filter(
        (e) =>
          e.getBoundingClientRect().right > innerWidth + 1 &&
          getComputedStyle(e).position !== 'absolute',
      )
      .slice(0, 8)
      .map((e) => ({ tag: e.tagName, class: e.className, right: e.getBoundingClientRect().right })),
  }));
  assert.ok(layout.fits, 'Home overflows at 320px: ' + JSON.stringify(layout.wide));
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.goto(base + '/discover');
  await page.getByRole('heading', { name: 'A little pause.' }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Production smoke passed: built server, sign-in/admin, CSP, 320px layout, PWA manifest/icons, service worker and offline fallback.',
  );
} finally {
  await browser?.close();
  await Promise.all(
    [child, frontend].map(async (process) => {
      process.kill();
      await new Promise<void>((resolve) => {
        if (process.exitCode !== null || process.signalCode !== null) resolve();
        else process.once('exit', () => resolve());
      });
    }),
  );
  await db.close();
}
