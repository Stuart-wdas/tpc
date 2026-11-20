import { connectDatabase } from '../db';
import { migrate } from './migrate';
const connection = await connectDatabase();
try {
  await migrate(connection.pool);
  console.log('Drizzle migrations applied.');
} finally {
  await connection.close();
}
