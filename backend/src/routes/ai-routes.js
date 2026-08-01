import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../validators/auth.js';
import { aiInsightSchema, insightParamSchema, listQuerySchema } from '../validators/domain.js';

const aiLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

export function aiRoutes({ authenticate, controller }) {
  const router = Router();
  router.post('/insights', aiLimiter, authenticate, validate(aiInsightSchema), controller.create);
  router.get('/insights', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.list);
  router.get('/insights/:insightId', authenticate, validate(insightParamSchema, 'params', 'validatedParams'), controller.detail);
  router.delete('/insights/:insightId', authenticate, validate(insightParamSchema, 'params', 'validatedParams'), controller.delete);
  return router;
}
