import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import type { Database } from './database/client';
import * as schema from './database/schema';

export function createAuth(db: Database, baseURL = process.env.APP_URL || 'http://localhost:3000') {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32))
    throw new Error('A strong BETTER_AUTH_SECRET is required in production.');
  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema, transaction: true }),
    baseURL,
    secret: secret || 'tpc-local-development-secret-change-before-production-2026',
    advanced: { ipAddress: { ipAddressHeaders: ['x-tpc-client-ip'] } },
    trustedOrigins: [baseURL, 'http://127.0.0.1:3000', 'http://127.0.0.1:3000/'],
    emailAndPassword: { enabled: true, minPasswordLength: 8, revokeSessionsOnPasswordReset: true },
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'member', input: false },
        disabled: { type: 'boolean', defaultValue: false, input: false },
      },
    },
    plugins: [username()],
    rateLimit: { enabled: process.env.NODE_ENV !== 'test', window: 60, max: 50 },
  });
}
export type Auth = ReturnType<typeof createAuth>;
