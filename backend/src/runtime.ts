import { connectDatabase } from './db';
import { createAuth } from './auth';
import { migrate } from './database/migrate';
import { createDatabase } from './database/client';
import { seed } from './seed';
import { createApp } from './app';
export async function runtime() {
  const db = await connectDatabase();
  try {
    await migrate(db.pool);
    const database = createDatabase(db.pool);
    const auth = createAuth(database);
    await seed(db.pool);
    return { app: createApp(db.pool, auth, database), close: db.close };
  } catch (e) {
    await db.close();
    throw e;
  }
}
