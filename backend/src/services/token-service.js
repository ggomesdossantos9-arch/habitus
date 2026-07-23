import { importPKCS8, importSPKI, SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';

const pem = (base64) => Buffer.from(base64, 'base64').toString('utf8');
export class TokenService {
  constructor(env) { this.env = env; this.privateKey = null; this.publicKey = null; }
  async init() { this.privateKey = await importPKCS8(pem(this.env.JWT_PRIVATE_KEY_BASE64), 'RS256'); this.publicKey = await importSPKI(pem(this.env.JWT_PUBLIC_KEY_BASE64), 'RS256'); return this; }
  async sign(user, type = 'access', expiry = this.env.ACCESS_TOKEN_TTL) {
    return new SignJWT({ type, ver: user.auth_version }).setProtectedHeader({ alg: 'RS256', kid: this.env.JWT_KEY_ID })
      .setIssuer(this.env.JWT_ISSUER).setAudience(this.env.JWT_AUDIENCE).setSubject(user.public_id).setJti(randomUUID())
      .setIssuedAt().setExpirationTime(expiry).sign(this.privateKey);
  }
  async verify(token, type = 'access') {
    const { payload, protectedHeader } = await jwtVerify(token, this.publicKey, { algorithms: ['RS256'], issuer: this.env.JWT_ISSUER, audience: this.env.JWT_AUDIENCE });
    if (protectedHeader.kid !== this.env.JWT_KEY_ID || payload.type !== type) throw new Error('invalid token type');
    return payload;
  }
}
