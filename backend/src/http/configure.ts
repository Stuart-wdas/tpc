import express, { type Express } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from '../auth';
export function configureHttp(app: Express, auth: Auth) {
  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');
  // Never accept a caller-supplied internal IP header.
  app.use((req, _res, next) => {
    req.headers['x-tpc-client-ip'] = req.ip || req.socket.remoteAddress || '127.0.0.1';
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:'],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                upgradeInsecureRequests: [],
              },
            }
          : false,
    }),
  );
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );
  app.all('/api/auth/*splat', toNodeHandler(auth));
  app.use(express.json({ limit: '32kb' }));
  // App mutations accept same-origin JSON requests only, including behind Vite's same-origin middleware.
  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const expected = new URL(
        process.env.APP_URL || 'http://localhost:3000' || 'http://127.0.0.1:3000',
      ).origin;
      if (req.headers.origin && req.headers.origin !== expected)
        return res.status(403).json({ error: 'This request came from an untrusted site.' });
      if (!req.is('application/json'))
        return res.status(415).json({ error: 'Use application/json.' });
    }
    next();
  });
}
