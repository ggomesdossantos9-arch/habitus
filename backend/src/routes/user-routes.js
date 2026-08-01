import { Router } from 'express';
import { validate } from '../validators/auth.js';
import { changePasswordSchema, consentEventSchema, deleteAccountSchema, profileUpdateSchema } from '../validators/domain.js';

export function userRoutes({ authenticate, controller }) {
  const router = Router();
  router.get('/me', authenticate, controller.me);
  router.patch('/me', authenticate, validate(profileUpdateSchema), controller.update);
  router.patch('/me/password', authenticate, validate(changePasswordSchema), controller.changePassword);
  router.delete('/me', authenticate, validate(deleteAccountSchema), controller.deleteAccount);
  router.get('/me/consents', authenticate, controller.consents);
  router.post('/me/consent-events', authenticate, validate(consentEventSchema), controller.addConsent);
  return router;
}
