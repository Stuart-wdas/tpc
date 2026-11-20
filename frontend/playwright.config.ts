import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(frontendRoot, '../backend');
config({ path: path.join(backendRoot, '.env'), quiet: true });
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;
if (!e2eDatabaseUrl)
  throw new Error('E2E_DATABASE_URL is required; use a separate disposable PostgreSQL database.');
if (process.env.DATABASE_URL) {
  const identity = (value: string) => {
    const url = new URL(value);
    const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      ? 'localhost'
      : url.hostname;
    return `${host}:${url.port || '5432'}${url.pathname}`;
  };
  if (identity(e2eDatabaseUrl) === identity(process.env.DATABASE_URL)) {
    throw new Error('E2E_DATABASE_URL must point to a separate disposable database.');
  }
}
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3001',
    actionTimeout: 10000,
    launchOptions: existsSync(edge) ? { executablePath: edge } : {},
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: backendRoot,
      url: 'http://localhost:4001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        PORT: '4001',
        APP_URL: 'http://localhost:3001',
        DATABASE_URL: e2eDatabaseUrl,
      },
    },
    {
      command: 'npm run dev',
      cwd: frontendRoot,
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { FRONTEND_PORT: '3001', API_TARGET: 'http://127.0.0.1:4001' },
    },
  ],
  reporter: [['list']],
});
