import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { emotionalEventSchema, eventParamSchema, listQuerySchema } from '../validators/domain.js';

export function emotionRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/', authenticate, controller.catalog);
  return router;
}

export function emotionalEventRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.listEvents);
  router.post('/', authenticate, validate(emotionalEventSchema), controller.createEvent);
  router.get('/:eventId', authenticate, validate(eventParamSchema, 'params', 'validatedParams'), controller.detailEvent);
  router.patch('/:eventId', authenticate, validate(eventParamSchema, 'params', 'validatedParams'), validate(emotionalEventSchema), controller.updateEvent);
  router.delete('/:eventId', authenticate, validate(eventParamSchema, 'params', 'validatedParams'), controller.deleteEvent);
  return router;
}
