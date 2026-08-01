import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGINS: z.string().default('http://localhost:5173'),
  JWT_ISSUER: z.string().default('habitus-api'),
  JWT_AUDIENCE: z.string().default('habitus-web'),
  JWT_KEY_ID: z.string().default('habitus-1'),
  JWT_PRIVATE_KEY_BASE64: z.string().min(1),
  JWT_PUBLIC_KEY_BASE64: z.string().min(1),
  ACCESS_TOKEN_TTL: z.string().regex(/^(?:[1-9]|1[0-5])m$/, 'deve estar entre 1m e 15m').default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(14),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  TOKEN_HMAC_SECRET: z.string().min(32),
  COOKIE_SECURE: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  GROQ_API_KEY: z.string().default(''),
  GROQ_BASE_URL: z.string().default('https://api.groq.com/openai/v1'),
  GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
  TERMS_VERSION: z.string().min(1),
  PRIVACY_VERSION: z.string().min(1),
}).superRefine((value, context) => {
  if (value.COOKIE_SAME_SITE === 'none' && !value.COOKIE_SECURE) context.addIssue({ code: z.ZodIssueCode.custom, path: ['COOKIE_SECURE'], message: 'deve ser true quando COOKIE_SAME_SITE=none' });
});

export function loadEnv(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) throw new Error(`Configuração inválida: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`);
  return { ...result.data, WEB_ORIGINS: result.data.WEB_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean) };
}
