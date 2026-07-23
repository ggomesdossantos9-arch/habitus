import { randomToken } from '../utils/crypto.js';

export class AuthController {
  constructor(service, env) { this.service = service; this.env = env; }
  cookieOptions(httpOnly = true, persistent = true) {
    const options = { httpOnly, secure: this.env.COOKIE_SECURE, sameSite: this.env.COOKIE_SAME_SITE, path: '/api/v1/auth' };
    if (persistent) options.maxAge = this.env.REFRESH_TOKEN_TTL_DAYS * 86400000;
    return options;
  }
  refreshCookieName() { return this.env.COOKIE_SECURE ? '__Secure-habitus_refresh' : 'habitus_refresh'; }
  setSession(res, result) { res.cookie(this.env.COOKIE_SECURE ? '__Secure-habitus_refresh' : 'habitus_refresh', result.refreshToken, this.cookieOptions()); delete result.refreshToken; }
  clearSession(res) { res.clearCookie(this.refreshCookieName(), this.cookieOptions(true, false)); res.clearCookie('habitus_csrf', this.cookieOptions(false, false)); }
  raw(req) { return req.cookies[this.refreshCookieName()]; }
  csrf = async (_req, res) => { const token = randomToken(); res.cookie('habitus_csrf', token, this.cookieOptions(false)).json({ data: { csrfToken: token } }); };
  register = async (req, res) => { const result = await this.service.register(req.validated, req); this.setSession(res, result); res.status(201).json({ data: result }); };
  login = async (req, res) => { const result = await this.service.login(req.validated, req); this.setSession(res, result); res.json({ data: result }); };
  refresh = async (req, res) => { const result = await this.service.rotate(this.raw(req), req); this.setSession(res, result); res.json({ data: result }); };
  logout = async (req, res) => { await this.service.logout(this.raw(req), req); this.clearSession(res); res.status(204).end(); };
  logoutAll = async (req, res) => { await this.service.logoutAll(req.user); this.clearSession(res); res.status(204).end(); };
  reauthenticate = async (req, res) => { res.json({ data: { reauthToken: await this.service.reauthenticate(req.user, req.validated.password), expiresIn: 300 } }); };
}
