import pino from 'pino';

export function createLogger(env) {
  return pino({ level: env.NODE_ENV === 'test' ? 'silent' : 'info', redact: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'] });
}
