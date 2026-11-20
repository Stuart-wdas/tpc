import './paths';
import { Pool } from 'pg';

export async function connectDatabase(test = false) {
  const variable = test ? 'TEST_DATABASE_URL' : 'DATABASE_URL';
  const connectionString = process.env[variable];
  if (!connectionString)
    throw new Error(
      `${variable} is required. Configure an existing PostgreSQL database in backend/.env.`,
    );
  if (test && process.env.DATABASE_URL) {
    const identity = (value: string) => {
      const url = new URL(value);
      const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        ? 'localhost'
        : url.hostname;
      return `${host}:${url.port || '5432'}${url.pathname}`;
    };
    if (identity(connectionString) === identity(process.env.DATABASE_URL))
      throw new Error('TEST_DATABASE_URL must point to a separate disposable database.');
  }
  const pool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 10000 });
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    await pool.end();
    throw error;
  }
  return { pool, close: () => pool.end() };
}
