import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((v) => v.toLowerCase());
const atMost72Bytes = (value) => Buffer.byteLength(value, 'utf8') <= 72;
const password = z.string().min(12).max(72).refine(atMost72Bytes, 'A senha excede 72 bytes');
const currentPassword = z.string().min(1).max(72).refine(atMost72Bytes, 'A senha excede 72 bytes');
export const registerSchema = z.object({ name: z.string().trim().min(2).max(120), email, password, termsVersion: z.string().max(30), privacyVersion: z.string().max(30) }).strict();
export const loginSchema = z.object({ email, password: currentPassword }).strict();
export const reauthenticateSchema = z.object({ password: currentPassword }).strict();

export function validate(schema, source = 'body', target = 'validated') {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const error = new Error('Revise os campos informados.'); error.status = 400; error.code = 'VALIDATION_ERROR';
      error.errors = parsed.error.issues.map((i) => ({ field: i.path.join('.'), code: i.code, message: i.message })); return next(error);
    }
    req[target] = parsed.data; next();
  };
}
