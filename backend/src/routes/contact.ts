import { Router } from 'express';
import { insertSubmission } from '../db/contact.js';
import { createContactRateLimiter } from '../middleware/contact-rate-limit.js';
import { contactSubmissionSchema } from '../validation/contact.js';

export function createContactRouter() {
  const contactRouter = Router();

  contactRouter.post('/contact', createContactRateLimiter(), (request, response) => {
    if (typeof request.body?.website === 'string' && request.body.website.trim().length > 0) {
      response.status(201).json({ ok: true });
      return;
    }

    const parsed = contactSubmissionSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        error: 'VALIDATION_ERROR',
        issues: parsed.error.issues.map((issue) => ({
          code: issue.code,
          path: issue.path,
          message: issue.message,
        })),
      });
      return;
    }

    insertSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      projectType: parsed.data.projectType,
      message: parsed.data.message,
    });

    response.status(201).json({ ok: true });
  });

  return contactRouter;
}
