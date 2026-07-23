import { z } from 'zod';

const withinBcryptLimit = (value) => new TextEncoder().encode(value).length <= 72;

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(12, 'Use pelo menos 12 caracteres.').max(72, 'Use no máximo 72 caracteres.').refine(withinBcryptLimit, 'A senha deve ter no máximo 72 bytes.'),
  confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  acceptedTerms: z.literal(true, { error: 'Aceite os termos e a política de privacidade.' }),
}).refine((data) => data.password === data.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não coincidem.' });
