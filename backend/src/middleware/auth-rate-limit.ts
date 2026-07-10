import rateLimit from 'express-rate-limit';
import type { AppConfig } from '../config.js';

export function createAuthRateLimiter(config: AppConfig) {
  return rateLimit({
    windowMs: config.authRateLimitWindowMs,
    limit: config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'RATE_LIMITED' },
  });
}
