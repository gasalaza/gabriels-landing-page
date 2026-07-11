// scripts/notify.test.mjs — Unit tests for notify.mjs (node:test, zero deps, no network)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSubject, resolveConfig, buildPayload, sendEmail } from './notify.mjs';

// ─── sanitizeSubject ─────────────────────────────────────────────

describe('sanitizeSubject', () => {
  test('strips CR and LF', () => {
    assert.equal(sanitizeSubject('Hello\r\nWorld'), 'HelloWorld');
  });

  test('strips control characters U+0000–U+001F', () => {
    assert.equal(sanitizeSubject('A\x00B\x01C\x1fD'), 'ABCD');
  });

  test('preserves normal text', () => {
    assert.equal(sanitizeSubject('Deploy v1.2 — done!'), 'Deploy v1.2 — done!');
  });

  test('handles empty string', () => {
    assert.equal(sanitizeSubject(''), '');
  });
});

// ─── resolveConfig ───────────────────────────────────────────────

describe('resolveConfig', () => {
  test('--to overrides NOTIFY_TO and CONTACT_NOTIFY_TO', () => {
    const env = { NOTIFY_TO: 'b@x.com', CONTACT_NOTIFY_TO: 'c@x.com' };
    const cfg = resolveConfig(env, ['--subject', 'S', '--to', 'a@x.com']);
    assert.equal(cfg.to, 'a@x.com');
  });

  test('NOTIFY_TO overrides CONTACT_NOTIFY_TO', () => {
    const env = { NOTIFY_TO: 'b@x.com', CONTACT_NOTIFY_TO: 'c@x.com' };
    const cfg = resolveConfig(env, ['--subject', 'S']);
    assert.equal(cfg.to, 'b@x.com');
  });

  test('falls back to CONTACT_NOTIFY_TO', () => {
    const env = { CONTACT_NOTIFY_TO: 'c@x.com' };
    const cfg = resolveConfig(env, ['--subject', 'S']);
    assert.equal(cfg.to, 'c@x.com');
  });

  test('sender fallback chain: --from > CONTACT_NOTIFY_FROM > default', () => {
    assert.equal(resolveConfig({}, ['--from', 'x@y.com']).from, 'x@y.com');
    assert.equal(resolveConfig({ CONTACT_NOTIFY_FROM: 'env@y.com' }, []).from, 'env@y.com');
    assert.equal(resolveConfig({}, []).from, 'onboarding@resend.dev');
  });

  test('reads RESEND_API_KEY from env', () => {
    const cfg = resolveConfig({ RESEND_API_KEY: 'sk_test_123' }, []);
    assert.equal(cfg.apiKey, 'sk_test_123');
  });

  test('--dry-run flag', () => {
    const cfg = resolveConfig({}, ['--dry-run', '--subject', 'X']);
    assert.equal(cfg.dryRun, true);
  });
});

// ─── buildPayload ────────────────────────────────────────────────

describe('buildPayload', () => {
  test('sanitizes subject and appends footer', () => {
    const cfg = { from: 'a@b.com', to: 'c@d.com', subject: 'Hi\r\nInjected', body: 'Body text' };
    const payload = buildPayload(cfg);
    assert.equal(payload.subject, 'HiInjected');
    assert.ok(payload.text.endsWith('\n\n— sent via scripts/notify.mjs'));
    assert.ok(payload.text.startsWith('Body text'));
  });

  test('includes from and to', () => {
    const cfg = { from: 'sender@x.com', to: 'recip@y.com', subject: 'S', body: 'B' };
    const payload = buildPayload(cfg);
    assert.equal(payload.from, 'sender@x.com');
    assert.equal(payload.to, 'recip@y.com');
  });
});

// ─── sendEmail ───────────────────────────────────────────────────

describe('sendEmail', () => {
  test('returns { ok: true, id } on 200 response', async () => {
    let capturedUrl, capturedOpts;
    const fakeFetch = async (url, opts) => {
      capturedUrl = url;
      capturedOpts = opts;
      return { ok: true, status: 200, json: async () => ({ id: 'msg_abc123' }) };
    };

    const cfg = { apiKey: 'sk_test_key', from: 'a@b.com', to: 'c@d.com', subject: 'Test', body: 'Hello' };
    const result = await sendEmail(cfg, fakeFetch);

    assert.deepEqual(result, { ok: true, id: 'msg_abc123' });
    assert.equal(capturedUrl, 'https://api.resend.com/emails');
    assert.equal(capturedOpts.headers.Authorization, 'Bearer sk_test_key');
    assert.equal(capturedOpts.headers['Content-Type'], 'application/json');
    assert.equal(capturedOpts.method, 'POST');
  });

  test('returns { ok: false, status } on non-2xx response', async () => {
    const fakeFetch = async () => ({ ok: false, status: 400, json: async () => ({}) });

    const cfg = { apiKey: 'sk_test_key', from: 'a@b.com', to: 'c@d.com', subject: 'X', body: 'Y' };
    const result = await sendEmail(cfg, fakeFetch);

    assert.deepEqual(result, { ok: false, status: 400 });
  });

  test('returns { ok: false, error } on network failure', async () => {
    const fakeFetch = async () => { throw new Error('network down'); };

    const cfg = { apiKey: 'sk_test_key', from: 'a@b.com', to: 'c@d.com', subject: 'X', body: 'Y' };
    const result = await sendEmail(cfg, fakeFetch);

    assert.deepEqual(result, { ok: false, error: 'network down' });
  });
});
