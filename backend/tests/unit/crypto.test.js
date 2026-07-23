import { describe, expect, it } from 'vitest';
import { randomToken, tokenHash } from '../../src/utils/crypto.js';
describe('tokens opacos', () => {
  it('gera entropia e persiste apenas hash determinístico', () => { const a = randomToken(), b = randomToken(); expect(a).not.toBe(b); expect(tokenHash(a)).toMatch(/^[a-f0-9]{64}$/); expect(tokenHash(a)).toBe(tokenHash(a)); });
});
