#!/usr/bin/env node
// scripts/notify.mjs — Zero-dependency Resend work-summary notifier (Node 22 ESM).
// Mirrors the raw-fetch pattern from backend/src/email/contact-notification.ts.

import { readFileSync } from 'node:fs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FETCH_TIMEOUT_MS = 10_000;
const FOOTER = '\n\n— sent via scripts/notify.mjs';

// ─── Exported helpers (pure, unit-testable) ──────────────────────

/** Strip CR, LF, and control characters to prevent header injection. */
export function sanitizeSubject(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\r\n\x00-\x1f]/g, '');
}

/**
 * Resolve config from env + CLI args.
 * @param {Record<string,string|undefined>} env - defaults to process.env
 * @param {string[]} args - defaults to process.argv.slice(2)
 */
export function resolveConfig(env = process.env, args = process.argv.slice(2)) {
  const parsed = parseArgs(args);

  const apiKey = env.RESEND_API_KEY || '';
  const from = parsed.from || env.CONTACT_NOTIFY_FROM || 'onboarding@resend.dev';
  const to = parsed.to || env.NOTIFY_TO || env.CONTACT_NOTIFY_TO || '';
  const subject = parsed.subject || '';
  const body = parsed.body || '';
  const dryRun = parsed.dryRun;

  return { apiKey, from, to, subject, body, dryRun };
}

/** Build the Resend payload from resolved config. Subject is sanitized; footer appended. */
export function buildPayload(cfg) {
  return {
    from: cfg.from,
    to: cfg.to,
    subject: sanitizeSubject(cfg.subject),
    text: cfg.body + FOOTER,
  };
}

/**
 * POST to Resend. Never throws on HTTP errors — returns a result object.
 * @param {object} cfg - resolved config (needs apiKey, from, to, subject, body)
 * @param {typeof fetch} fetchImpl - injectable for testing
 */
export async function sendEmail(cfg, fetchImpl = fetch) {
  const payload = buildPayload(cfg);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, id: data.id };
    }
    return { ok: false, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// ─── CLI internals ───────────────────────────────────────────────

function parseArgs(args) {
  const result = { subject: '', body: '', to: '', from: '', dryRun: false, help: false, bodyFile: '' };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--subject':
        result.subject = args[++i] || '';
        break;
      case '--body':
        result.body = args[++i] || '';
        break;
      case '--body-file':
        result.bodyFile = args[++i] || '';
        break;
      case '--to':
        result.to = args[++i] || '';
        break;
      case '--from':
        result.from = args[++i] || '';
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--help':
        result.help = true;
        break;
    }
  }
  return result;
}

function printUsage() {
  const text = `Usage: node scripts/notify.mjs --subject "..." [options]

Options:
  --subject "..."      Email subject (required)
  --body "..."         Email body text
  --body-file <path>   Read body from file
  (stdin)              If no --body/--body-file and stdin is piped, reads stdin
  --to <email>         Recipient override (default: NOTIFY_TO or CONTACT_NOTIFY_TO)
  --from <email>       Sender override (default: CONTACT_NOTIFY_FROM or onboarding@resend.dev)
  --dry-run            Print resolved payload without sending
  --help               Show this help

Environment:
  RESEND_API_KEY       Required for actual sends
  CONTACT_NOTIFY_TO    Default recipient
  CONTACT_NOTIFY_FROM  Default sender
  NOTIFY_TO            Optional separate recipient override

Examples:
  npm run notify -- --subject "Deploy done" --body "v0.1 shipped."
  echo "body" | node scripts/notify.mjs --subject "Piped"
  node scripts/notify.mjs --dry-run --subject "Test" --body "Hello"
`;
  process.stdout.write(text);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  // Resolve body: --body > --body-file > stdin (if piped)
  let body = parsed.body;
  if (!body && parsed.bodyFile) {
    try {
      body = readFileSync(parsed.bodyFile, 'utf8');
    } catch (err) {
      process.stderr.write(`Error reading body file: ${err.message}\n`);
      process.exit(2);
    }
  }
  if (!body && !process.stdin.isTTY) {
    body = await readStdin();
  }

  if (!parsed.subject) {
    process.stderr.write('Error: --subject is required.\n');
    process.exit(2);
  }
  if (!body) {
    process.stderr.write('Error: body is required (use --body, --body-file, or pipe stdin).\n');
    process.exit(2);
  }

  // Build final config (override body with resolved value)
  const env = process.env;
  const cfg = resolveConfig(env, args);
  cfg.body = body;

  if (cfg.dryRun) {
    process.stdout.write(JSON.stringify({ from: cfg.from, to: cfg.to, subject: sanitizeSubject(cfg.subject), body: cfg.body }, null, 2) + '\n');
    process.exit(0);
  }

  // Real send validations
  if (!cfg.apiKey) {
    process.stderr.write('Error: RESEND_API_KEY is not set.\n');
    process.exit(1);
  }
  if (!cfg.to) {
    process.stderr.write('Error: no recipient resolved (set --to, NOTIFY_TO, or CONTACT_NOTIFY_TO).\n');
    process.exit(1);
  }

  const result = await sendEmail(cfg);
  if (result.ok) {
    process.stdout.write(`sent: ${result.id}\n`);
    process.exit(0);
  } else {
    const detail = result.status ? `HTTP ${result.status}` : result.error;
    process.stderr.write(`send failed: ${detail}\n`);
    process.exit(1);
  }
}

// Run only when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
