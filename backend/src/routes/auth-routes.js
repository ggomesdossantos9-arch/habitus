import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate, registerSchema, loginSchema, reauthenticateSchema } from '../validators/auth.js';

const limiter = (max) => rateLimit({ windowMs: 15 * 60_000, limit: max, standardHeaders: 'draft-7', legacyHeaders: false });
export function authRoutes({ controller, authenticate, csrf }) {
  const router = Router();
  router.get('/csrf', controller.csrf);
  router.post('/register', limiter(5), validate(registerSchema), controller.register);
  router.post('/login', limiter(10), validate(loginSchema), controller.login);
  router.post('/refresh', limiter(30), csrf, controller.refresh);
  router.post('/logout', csrf, controller.logout);
  router.post('/logout-all', authenticate, controller.logoutAll);
  router.post('/reauthenticate', limiter(10), authenticate, validate(reauthenticateSchema), controller.reauthenticate);
  return router;
}
