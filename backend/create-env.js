import fs from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const priv = Buffer.from(privateKey).toString('base64');
const pub = Buffer.from(publicKey).toString('base64');
const secret = Buffer.from('habitus-local-development-secret').toString('base64');
const env = `NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://habitus:change-me@127.0.0.1:3306/habitus
WEB_ORIGINS=http://127.0.0.1:5173
JWT_ISSUER=habitus-api
JWT_AUDIENCE=habitus-web
JWT_KEY_ID=habitus-dev-1
JWT_PRIVATE_KEY_BASE64=${priv}
JWT_PUBLIC_KEY_BASE64=${pub}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=14
BCRYPT_ROUNDS=12
TOKEN_HMAC_SECRET=${secret}
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
TRUST_PROXY=1
TERMS_VERSION=1.0
PRIVACY_VERSION=1.0
`;
fs.writeFileSync('.env', env, { encoding: 'utf8' });
console.log('.env created');
