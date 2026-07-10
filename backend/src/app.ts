import express from 'express';
import { openDatabase } from './db/database.js';
import { applySecurityHeaders } from './middleware/security-headers.js';
import { createContactRouter } from './routes/contact.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(applySecurityHeaders());
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  openDatabase().close();

  app.use('/api', createContactRouter());
  app.use('/api', healthRouter);

  return app;
}
