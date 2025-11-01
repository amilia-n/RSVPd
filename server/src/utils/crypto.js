import crypto from 'node:crypto';
import { config } from '../config/env.js';

export function hmacSha256Hex(input) {
  const h = crypto.createHmac('sha256', config.QR_HMAC_SECRET);
  h.update(input);
  return h.digest('hex');
}

export function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}
