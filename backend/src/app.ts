import express from 'express';
import type { Pool } from 'pg';
import type { Auth } from './auth';
import { createDatabase, type Database } from './database/client';
import { userRepository } from './database/users';
import { configureHttp } from './http/configure';
import { createAccessMiddleware } from './http/authentication';
import { handleApiError } from './http/errors';
import { registerDiscoveryRoutes } from './routes/discovery';
import { registerMemberRoutes } from './routes/members';
import { registerBusinessRoutes } from './routes/business';
import { registerAdminRoutes } from './routes/admin';

export function createApp(pool: Pool, auth: Auth, database: Database = createDatabase(pool)) {
  const app = express();
  const users = userRepository(database);
  const access = createAccessMiddleware(auth, users);
  const dependencies = { pool, users, ...access };

  configureHttp(app, auth);

  app.get('/api/health', async (_request, response) => {
    await pool.query('SELECT 1');
    response.json({ ok: true });
  });

  registerDiscoveryRoutes(app, dependencies);
  registerMemberRoutes(app, dependencies);
  registerBusinessRoutes(app, dependencies);
  registerAdminRoutes(app, dependencies);

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found.' });
  });
  app.use(handleApiError);
  return app;
}
