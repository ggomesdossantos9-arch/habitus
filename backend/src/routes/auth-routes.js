import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate, registerSchema, loginSchema, reauthenticateSchema } from '../validators/auth.js';

const limiter = (max) => rateLimit({ windowMs: 15 * 60_000, limit: max, standardHeaders: 'draft-7', legacyHeaders: false });
export function authRoutes({ controller, authenticate, csrf }) {
  const router = Router();
  const handlers = {
    csrf: controller.csrf.bind(controller),
    register: controller.register.bind(controller),
    login: controller.login.bind(controller),
    refresh: controller.refresh.bind(controller),
    logout: controller.logout.bind(controller),
    logoutAll: controller.logoutAll.bind(controller),
    reauthenticate: controller.reauthenticate.bind(controller),
  };
  router.get('/csrf', handlers.csrf);
  router.post('/register', limiter(5), validate(registerSchema), handlers.register);
  router.post('/login', limiter(10), validate(loginSchema), handlers.login);
  router.post('/refresh', limiter(30), csrf, handlers.refresh);
  router.post('/logout', csrf, handlers.logout);
  router.post('/logout-all', authenticate, handlers.logoutAll);
  router.post('/reauthenticate', limiter(10), authenticate, validate(reauthenticateSchema), handlers.reauthenticate);
  return router;
}
