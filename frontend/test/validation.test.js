import test from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema } from '../src/utils/validation.js';

test('login exige e-mail válido e senha', () => {
  assert.equal(loginSchema.safeParse({ email: 'invalido', password: '' }).success, false);
  assert.equal(loginSchema.safeParse({ email: 'pessoa@exemplo.com', password: 'senha' }).success, true);
});

test('cadastro exige senha forte, confirmação e consentimento', () => {
  const valid = { name: 'Pessoa Teste', email: 'pessoa@exemplo.com', password: 'uma-senha-segura', confirmPassword: 'uma-senha-segura', acceptedTerms: true };
  assert.equal(registerSchema.safeParse(valid).success, true);
  assert.equal(registerSchema.safeParse({ ...valid, confirmPassword: 'outra-senha-segura' }).success, false);
  assert.equal(registerSchema.safeParse({ ...valid, acceptedTerms: false }).success, false);
  const multibyte = 'á'.repeat(40);
  assert.equal(registerSchema.safeParse({ ...valid, password: multibyte, confirmPassword: multibyte }).success, false);
});
