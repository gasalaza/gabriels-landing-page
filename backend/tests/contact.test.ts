import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { listSubmissions } from '../src/db/contact.js';

const testDatabasePath = resolve('data/contact-api-test.sqlite');

function resetDatabase() {
  if (existsSync(testDatabasePath)) {
    rmSync(testDatabasePath);
  }
}

function validPayload() {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    projectType: 'landing',
    message: 'I need a landing page for a launch.',
    website: '',
  };
}

describe('contact route', () => {
  beforeEach(() => {
    process.env.SQLITE_DATABASE_PATH = testDatabasePath;
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.CONTACT_RATE_LIMIT_MAX = '5';
    resetDatabase();
  });

  afterEach(() => {
    resetDatabase();
    delete process.env.SQLITE_DATABASE_PATH;
    delete process.env.CONTACT_RATE_LIMIT_WINDOW_MS;
    delete process.env.CONTACT_RATE_LIMIT_MAX;
  });

  it('persists a valid submission and returns 201', async () => {
    const response = await request(createApp()).post('/api/contact').send(validPayload());

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true });
    expect(listSubmissions()).toEqual([
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        projectType: 'landing',
        message: 'I need a landing page for a launch.',
        read: false,
      }),
    ]);
  });

  it('rejects a missing email', async () => {
    const response = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), email: undefined });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(listSubmissions()).toEqual([]);
  });

  it('rejects an invalid email', async () => {
    const response = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(listSubmissions()).toEqual([]);
  });

  it('silently drops honeypot submissions without persisting them', async () => {
    const response = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), website: 'https://spam.example' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ok: true });
    expect(listSubmissions()).toEqual([]);
  });

  it('rejects messages longer than 5000 characters', async () => {
    const response = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), message: 'a'.repeat(5001) });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION_ERROR');
    expect(listSubmissions()).toEqual([]);
  });

  it('rate limits the sixth rapid request from the same client', async () => {
    const app = createApp();

    for (let requestNumber = 0; requestNumber < 5; requestNumber += 1) {
      const response = await request(app)
        .post('/api/contact')
        .send({ ...validPayload(), email: `jane${requestNumber}@example.com` });
      expect(response.status).toBe(201);
    }

    const limitedResponse = await request(app)
      .post('/api/contact')
      .send({ ...validPayload(), email: 'jane6@example.com' });

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body.error.code).toBe('RATE_LIMITED');
    expect(listSubmissions()).toHaveLength(5);
  });
});

describe('contact input-bounds validation', () => {
  beforeEach(() => {
    process.env.SQLITE_DATABASE_PATH = testDatabasePath;
    process.env.CONTACT_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.CONTACT_RATE_LIMIT_MAX = '100';
    resetDatabase();
  });

  afterEach(() => {
    resetDatabase();
    delete process.env.SQLITE_DATABASE_PATH;
    delete process.env.CONTACT_RATE_LIMIT_WINDOW_MS;
    delete process.env.CONTACT_RATE_LIMIT_MAX;
  });

  it('rejects name exceeding 100 characters', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), name: 'a'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('accepts name at exactly 100 characters', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), name: 'a'.repeat(100) });

    expect(res.status).toBe(201);
  });

  it('rejects empty name', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects email exceeding 200 characters', async () => {
    const longEmail = 'a'.repeat(192) + '@test.com'; // 201 chars
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), email: longEmail });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects empty message', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid projectType', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), projectType: 'hacking' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing projectType', async () => {
    const { projectType: _projectType, ...noType } = validPayload();
    const res = await request(createApp())
      .post('/api/contact')
      .send(noType);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('accepts all valid projectType values', async () => {
    const app = createApp();
    for (const pType of ['landing', 'fullstack', 'consult', 'other']) {
      const res = await request(app)
        .post('/api/contact')
        .send({ ...validPayload(), projectType: pType });
      expect(res.status).toBe(201);
    }
  });

  it('silently accepts (201) but drops a filled honeypot website field', async () => {
    const res = await request(createApp())
      .post('/api/contact')
      .send({ ...validPayload(), website: 'http://spam.example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ ok: true });
    expect(listSubmissions()).toEqual([]);
  });

  it('rejects missing name field entirely', async () => {
    const { name: _name, ...noName } = validPayload();
    const res = await request(createApp())
      .post('/api/contact')
      .send(noName);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing email field entirely', async () => {
    const { email: _email, ...noEmail } = validPayload();
    const res = await request(createApp())
      .post('/api/contact')
      .send(noEmail);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });
});
