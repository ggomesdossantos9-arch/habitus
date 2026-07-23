import { Router } from 'express';
export function userRoutes({ authenticate, service }) {
  const router = Router();
  router.get('/me', authenticate, (req, res) => res.json({ data: service.profile(req.user) }));
  return router;
}
