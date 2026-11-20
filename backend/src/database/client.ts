import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import * as schema from './schema';

export const createDatabase = (pool: Pool) => drizzle(pool, { schema });
export type Database = ReturnType<typeof createDatabase>;
