import { connectDatabase } from './db';
import { migrate } from './database/migrate';
import { seed } from './seed';
const db = await connectDatabase();
try {
  await migrate(db.pool);
  await seed(db.pool);
  console.log('Database migrated and seeded.');
} finally {
  await db.close();
}
