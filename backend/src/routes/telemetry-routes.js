import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { listQuerySchema } from '../validators/domain.js';

export function telemetryRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/summary', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.summary);
  router.get('/trends', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.trends);
  router.get('/distribution', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.distribution);
  router.get('/habit-correlations', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.habitCorrelations);
  return router;
}
