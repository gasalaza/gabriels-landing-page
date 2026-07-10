import rateLimit from 'express-rate-limit';
import type { AppConfig } from '../config.js';
import { getClientIp } from './client-ip.js';

export function createAuthRateLimiter(config: AppConfig) {
  return rateLimit({
    windowMs: config.authRateLimitWindowMs,
    limit: config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    message: { error: 'RATE_LIMITED' },
  });
}
