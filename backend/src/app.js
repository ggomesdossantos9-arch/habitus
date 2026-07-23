import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { AuthRepository } from './repositories/auth-repository.js';
import { AuthService } from './services/auth-service.js';
import { AuthController } from './controllers/auth-controller.js';
import { authenticate } from './middlewares/authenticate.js';
import { csrfProtection } from './middlewares/csrf.js';
import { authRoutes } from './routes/auth-routes.js';
import { userRoutes } from './routes/user-routes.js';
import { errorHandler, notFound, Problem } from './utils/problem.js';

export function createApp({ env, db, tokens, logger, overrides = {} }) {
  const repository = overrides.repository ?? new AuthRepository(db), service = overrides.service ?? new AuthService({ db, repository, tokens, env });
  const auth = authenticate({ tokens, repository }), controller = new AuthController(service, env);
  const app = express(); app.set('trust proxy', env.TRUST_PROXY); app.disable('x-powered-by');
  app.use(pinoHttp({ logger, genReqId: (req, res) => { const id = req.headers['x-request-id']?.slice(0, 100) || randomUUID(); res.setHeader('x-request-id', id); return id; } }));
  app.use(helmet());
  app.use(cors({ origin(origin, callback) { if (!origin || env.WEB_ORIGINS.includes(origin)) callback(null, true); else callback(new Problem(403, 'ORIGIN_DENIED', 'Origem não autorizada.')); }, credentials: true }));
  app.use(express.json({ limit: '100kb', type: 'application/json' })); app.use(cookieParser());
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/ready', async (_req, res, next) => { try { await db.raw('SELECT 1'); res.json({ data: { status: 'ready' } }); } catch { next(new Problem(503, 'NOT_READY', 'Serviço temporariamente indisponível.')); } });
  app.use('/api/v1/auth', authRoutes({ controller, authenticate: auth, csrf: csrfProtection(env) }));
  app.use('/api/v1/users', userRoutes({ authenticate: auth, service }));
  app.use(notFound); app.use(errorHandler); return app;
}
