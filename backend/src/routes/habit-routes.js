import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { checkinParamSchema, checkinSchema, dateQuerySchema, habitCreateSchema, habitParamSchema, habitUpdateSchema, listQuerySchema } from '../validators/domain.js';

export function habitRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/', authenticate, validate(listQuerySchema, 'query', 'validatedQuery'), controller.list);
  router.post('/', authenticate, validate(habitCreateSchema), controller.create);
  router.get('/:habitId', authenticate, validate(habitParamSchema, 'params', 'validatedParams'), controller.detail);
  router.patch('/:habitId', authenticate, validate(habitParamSchema, 'params', 'validatedParams'), validate(habitUpdateSchema), controller.update);
  router.delete('/:habitId', authenticate, validate(habitParamSchema, 'params', 'validatedParams'), controller.archive);
  router.post('/:habitId/restore', authenticate, validate(habitParamSchema, 'params', 'validatedParams'), controller.restore);
  router.get('/:habitId/checkins', authenticate, validate(habitParamSchema, 'params', 'validatedParams'), validate(listQuerySchema, 'query', 'validatedQuery'), controller.listCheckins);
  router.put('/:habitId/checkins/:date', authenticate, validate(checkinParamSchema, 'params', 'validatedParams'), validate(checkinSchema), controller.upsertCheckin);
  router.delete('/:habitId/checkins/:date', authenticate, validate(checkinParamSchema, 'params', 'validatedParams'), controller.deleteCheckin);
  return router;
}

export function dailyPlanRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/', authenticate, validate(dateQuerySchema, 'query', 'validatedQuery'), controller.dailyPlan);
  return router;
}
