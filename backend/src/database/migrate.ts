import path from 'node:path';
import { migrate as runDrizzleMigrations } from 'drizzle-orm/node-postgres/migrator';
import type { Pool } from 'pg';
import { backendRoot } from '../paths';
import { createDatabase } from './client';

export async function migrate(pool: Pool) {
  // Serialize migration startup across processes; release even when a migration fails.
  const lock = await pool.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(83641209)');
    await runDrizzleMigrations(createDatabase(pool), {
      migrationsFolder: path.join(backendRoot, 'drizzle'),
    });
  } finally {
    await lock.query('SELECT pg_advisory_unlock(83641209)');
    lock.release();
  }
}
