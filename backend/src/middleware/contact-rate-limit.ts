import rateLimit from 'express-rate-limit';
import { getClientIp } from './client-ip.js';

function readPositiveInteger(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createContactRateLimiter() {
  return rateLimit({
    windowMs: readPositiveInteger('CONTACT_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000),
    limit: readPositiveInteger('CONTACT_RATE_LIMIT_MAX', 5),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    },
  });
}
