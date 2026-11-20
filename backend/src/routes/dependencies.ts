import type { RequestHandler } from 'express';
import type { Pool } from 'pg';
import type { UserRepository } from '../database/users';
export type RouteDependencies = {
  pool: Pool;
  users: UserRepository;
  requireUser: RequestHandler;
  requireRole: (...roles: string[]) => RequestHandler;
};
