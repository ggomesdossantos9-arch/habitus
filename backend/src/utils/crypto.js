import { createHash, createHmac, randomBytes } from 'node:crypto';

export const randomToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (value) => createHash('sha256').update(value).digest('hex');
export const ipHmac = (value, secret) => value ? createHmac('sha256', secret).update(value).digest('hex') : null;
