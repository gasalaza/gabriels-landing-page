import { z } from 'zod';

export const projectTypes = ['landing', 'fullstack', 'consult', 'other'] as const;

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  projectType: z.enum(projectTypes),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(0).optional().default(''),
});

export type ContactSubmissionPayload = z.infer<typeof contactSubmissionSchema>;
