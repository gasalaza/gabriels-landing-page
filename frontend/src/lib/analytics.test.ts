import { afterEach, describe, expect, it } from 'vitest';
import { injectBeacon, initAnalytics } from './analytics';

describe('injectBeacon', () => {
  afterEach(() => {
    document.querySelectorAll('script[data-cf-beacon]').forEach((el) => el.remove());
  });

  it('injects a deferred beacon script with the token', () => {
    injectBeacon('test-token-123');

    const script = document.querySelector('script[data-cf-beacon]') as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.defer).toBe(true);
    expect(script.src).toBe('https://static.cloudflareinsights.com/beacon.min.js');
    expect(script.getAttribute('data-cf-beacon')).toBe(JSON.stringify({ token: 'test-token-123' }));
  });

  it('is idempotent — calling twice yields exactly one beacon script', () => {
    injectBeacon('abc');
    injectBeacon('abc');

    const scripts = document.querySelectorAll('script[data-cf-beacon]');
    expect(scripts).toHaveLength(1);
  });

  it('no-ops on empty-string token', () => {
    injectBeacon('');

    const script = document.querySelector('script[data-cf-beacon]');
    expect(script).toBeNull();
  });
});

describe('initAnalytics', () => {
  afterEach(() => {
    document.querySelectorAll('script[data-cf-beacon]').forEach((el) => el.remove());
  });

  it('is a no-op in the test environment (non-production)', () => {
    initAnalytics();

    const script = document.querySelector('script[data-cf-beacon]');
    expect(script).toBeNull();
  });
});
