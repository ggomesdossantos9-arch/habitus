import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { entryParamSchema, journalSchema, journalUpdateSchema, listQuerySchema } from '../validators/domain.js';

export function journalRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.list);
  router.post('/', authenticate, validate(journalSchema), controller.create);
  router.get('/:entryId', authenticate, validate(entryParamSchema, 'params', 'validatedParams'), controller.detail);
  router.patch('/:entryId', authenticate, validate(entryParamSchema, 'params', 'validatedParams'), validate(journalUpdateSchema), controller.update);
  router.post('/:entryId/complete', authenticate, validate(entryParamSchema, 'params', 'validatedParams'), controller.complete);
  router.delete('/:entryId', authenticate, validate(entryParamSchema, 'params', 'validatedParams'), controller.delete);
  return router;
}
