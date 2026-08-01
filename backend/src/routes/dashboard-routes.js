import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { listQuerySchema } from '../validators/domain.js';

export function dashboardRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/summary', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.summary);
  router.get('/habits', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.habits);
  router.get('/emotions', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.emotions);
  router.get('/streaks', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.streaks);
  return router;
}
