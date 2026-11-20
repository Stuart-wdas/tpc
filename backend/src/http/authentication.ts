import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import type { Auth } from '../auth';
import type { UserRepository } from '../database/users';
import { HttpError } from './errors';
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  disabled: boolean;
};
declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export function createAccessMiddleware(auth: Auth, users: UserRepository) {
  const requireUser = async (req: Request, _res: Response, next: NextFunction) => {
    const data = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!data) return next(new HttpError(401, 'Please sign in to continue.'));
    const user = await users.findById(data.user.id);
    if (!user || user.disabled)
      return next(new HttpError(403, 'Your account is disabled. Please contact TPC.'));
    req.currentUser = user;
    next();
  };
  const requireRole =
    (...roles: string[]) =>
    (req: Request, _res: Response, next: NextFunction) =>
      roles.includes(req.currentUser!.role)
        ? next()
        : next(new HttpError(403, 'You do not have access to this portal.'));

  return { requireUser, requireRole };
}
