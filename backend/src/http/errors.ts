import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};

export const handleApiError = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if ((error as { type?: string }).type === 'entity.parse.failed')
    return res.status(400).json({ error: 'Invalid JSON.' });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
};
