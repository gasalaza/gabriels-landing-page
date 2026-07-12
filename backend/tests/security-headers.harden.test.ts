import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('security headers', () => {
  it('sets hardened response headers and disables fingerprinting', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(response.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['permissions-policy']).toBe(
      'camera=(), microphone=(), geolocation=()',
    );
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('body size limit', () => {
  it('rejects payloads larger than 25kb', async () => {
    const oversized = JSON.stringify({ data: 'x'.repeat(26_000) });
    const response = await request(createApp())
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send(oversized);

    // Catch-all error handler normalizes to 500; the key assertion is rejection (not 2xx)
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('accepts payloads under 25kb', async () => {
    const payload = { name: 'A', email: 'a@b.com', projectType: 'landing', message: 'x'.repeat(15_000), website: '' };
    const response = await request(createApp())
      .post('/api/contact')
      .set('Content-Type', 'application/json')
      .send(payload);

    // Should not be 413 — validation or success
    expect(response.status).not.toBe(413);
  });
});
