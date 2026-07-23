import { beforeAll, describe, expect, it } from 'vitest';
import { exportPKCS8, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { TokenService } from '../../src/services/token-service.js';

const base64 = (value) => Buffer.from(value).toString('base64');
let service;
let keys;

beforeAll(async () => {
  keys = await generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
  service = await new TokenService({
    JWT_PRIVATE_KEY_BASE64: base64(await exportPKCS8(keys.privateKey)),
    JWT_PUBLIC_KEY_BASE64: base64(await exportSPKI(keys.publicKey)),
    JWT_KEY_ID: 'test-key',
    JWT_ISSUER: 'habitus-api',
    JWT_AUDIENCE: 'habitus-web',
    ACCESS_TOKEN_TTL: '15m',
  }).init();
});

describe('TokenService', () => {
  it('assina e valida access JWT com claims de segurança', async () => {
    const token = await service.sign({ public_id: 'user-public-id', auth_version: 3 });
    const payload = await service.verify(token);
    expect(payload).toMatchObject({ sub: 'user-public-id', type: 'access', ver: 3, iss: 'habitus-api', aud: 'habitus-web' });
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('rejeita tipo e kid diferentes', async () => {
    const reauth = await service.sign({ public_id: 'user-public-id', auth_version: 3 }, 'reauth', '5m');
    await expect(service.verify(reauth)).rejects.toThrow();

    const wrongKid = await new SignJWT({ type: 'access', ver: 3 }).setProtectedHeader({ alg: 'RS256', kid: 'wrong-key' })
      .setIssuer('habitus-api').setAudience('habitus-web').setSubject('user-public-id').setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
    await expect(service.verify(wrongKid)).rejects.toThrow();
  });
});
