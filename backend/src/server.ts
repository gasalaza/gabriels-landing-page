import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

// Local-dev convenience: load a repo-root .env into process.env. Resolved from this module's
// URL so it points at the repo root in both dev (backend/src/server.ts) and prod build
// (backend/dist/server.js) — ../../ from either is the repo root. Guarded so it's a no-op when
// no .env exists (e.g. production on Railway, which injects real env vars).
const envFilePath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const app = createApp();

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
