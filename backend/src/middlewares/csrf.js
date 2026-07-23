import { timingSafeEqual } from 'node:crypto';
import { Problem } from '../utils/problem.js';

export function csrfProtection(env) {
  return (req, _res, next) => {
    const origin = req.get('origin');
    if (origin && !env.WEB_ORIGINS.includes(origin)) return next(new Problem(403, 'ORIGIN_DENIED', 'Origem não autorizada.'));
    const cookie = req.cookies.habitus_csrf, header = req.get('x-csrf-token');
    const cookieBuffer = cookie ? Buffer.from(cookie) : null;
    const headerBuffer = header ? Buffer.from(header) : null;
    if (!cookieBuffer || !headerBuffer || cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) return next(new Problem(403, 'CSRF_INVALID', 'Token CSRF inválido.'));
    next();
  };
}
