import type { Request } from 'express';

/** Extracts the real client IP, preferring Cloudflare's trusted header. */
export function getClientIp(req: Request): string {
  return (req.headers['cf-connecting-ip'] as string) || req.ip || '127.0.0.1';
}
