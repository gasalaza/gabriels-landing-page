import { loadConfig } from '../config.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FETCH_TIMEOUT_MS = 10_000;

function sanitizeSubject(name: string): string {
  // Strip CR, LF, and control characters (U+0000–U+001F) to prevent header injection
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\r\n\x00-\x1f]/g, '');
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  projectType: string;
  message: string;
  createdAt?: string;
}): Promise<void> {
  const config = loadConfig();

  if (!config.resendApiKey || !config.contactNotifyTo) {
    console.info('[contact] email notification skipped: Resend not configured');
    return;
  }

  const safeName = sanitizeSubject(input.name);
  const subject = `New contact: ${safeName} (${input.projectType})`;
  const received = input.createdAt ?? new Date().toISOString();
  const text = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Project type: ${input.projectType}`,
    `Received: ${received}`,
    '',
    input.message,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.contactNotifyFrom,
        to: config.contactNotifyTo,
        reply_to: input.email,
        subject,
        text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[contact] email send failed: HTTP ${response.status}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`[contact] email send error: ${message}`);
  } finally {
    clearTimeout(timer);
  }
}
