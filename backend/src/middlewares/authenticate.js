import { Problem } from '../utils/problem.js';

export function authenticate({ tokens, repository }) {
  return async (req, _res, next) => {
    try {
      const [scheme, token] = (req.get('authorization') ?? '').split(' ');
      if (scheme !== 'Bearer' || !token) throw new Problem(401, 'AUTHENTICATION_REQUIRED', 'Autenticação necessária.');
      const payload = await tokens.verify(token);
      const user = await repository.findUserByPublicId(payload.sub);
      if (!user || user.status !== 'active' || user.auth_version !== payload.ver) throw new Problem(401, 'TOKEN_INVALID', 'Token inválido ou expirado.');
      req.user = user; next();
    } catch (error) { next(error instanceof Problem ? error : new Problem(401, 'TOKEN_INVALID', 'Token inválido ou expirado.')); }
  };
}
