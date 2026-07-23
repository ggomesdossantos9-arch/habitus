import { describe, expect, it } from 'vitest';
import { registerSchema } from '../../src/validators/auth.js';

describe('registerSchema', () => {
  it('normaliza e-mail e rejeita senha curta', () => {
    expect(registerSchema.safeParse({ name: 'Ana', email: ' ANA@EXAMPLE.COM ', password: 'curta', termsVersion: '1.0', privacyVersion: '1.0' }).success).toBe(false);
    const parsed = registerSchema.parse({ name: 'Ana', email: ' ANA@EXAMPLE.COM ', password: 'uma-senha-segura', termsVersion: '1.0', privacyVersion: '1.0' });
    expect(parsed.email).toBe('ana@example.com');
  });
  it('rejeita campos inesperados', () => expect(registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'uma-senha-segura', termsVersion: '1', privacyVersion: '1', admin: true }).success).toBe(false));
});
