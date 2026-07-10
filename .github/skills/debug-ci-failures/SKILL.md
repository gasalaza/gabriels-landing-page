# Skill: Debug CI Failures

Diagnose and fix GitHub Actions Continuous Integration (CI) failures in this repository using the GitHub Model Context Protocol (MCP) server and Copilot CLI built-in agents.

---

## When to Use This Skill

Invoke this skill when:
- A CI workflow run shows a red ❌ status on a pull request (PR).
- A `npm test` or `npm run build` step fails in the Actions log.
- You need to triage a failure before deciding who should fix it.

---

## Protocol

### Step 1 — Identify the failing run

Use the `github` MCP server tool `list_workflow_runs` for the current branch to find the latest failed run:

```
List the latest workflow runs for branch {branch-name}.
```

### Step 2 — Fetch the failure log

Use `get_job_logs` with `failed_only: true` on the run ID to retrieve only the failed job logs:

```
Get logs for all failed jobs in run {run_id}.
```

Look for:
- **Test failures**: stack traces with file paths and line numbers.
- **Build failures**: TypeScript or Webpack errors with file and line.
- **Lint failures**: ESLint rule names and file paths.
- **Dependency errors**: `npm ERR!` or missing module messages.

### Step 3 — Classify the failure

| Failure type | Route to | Action |
|---|---|---|
| Test failure (logic) | Switch | Fix test or fix the code under test |
| Build failure (frontend) | Trinity | Fix React/TypeScript compile error |
| Build failure (backend) | Tank | Fix Node/import error |
| Security lint warning | Neo | Review and remediate |
| Dependency resolution | Tank | Update `package.json` / lock file |
| Infrastructure / workflow YAML | Morpheus | Fix workflow definition |

### Step 4 — Fix and verify locally

Before pushing a fix:

```sh
npm test          # must pass
npm run build     # must pass
```

### Step 5 — Push and confirm CI green

Push the fix branch and confirm the workflow run status turns green ✅.

---

## Common Failure Patterns

### `Cannot find module` in backend tests

Usually caused by a missing `require`/`import` path or a dependency not installed.

```sh
cd backend && npm install
npm test
```

### FTS5 `content_search` query error

The app uses a Full-Text Search 5 (FTS5) virtual table via Node's built-in `node:sqlite`. If tests fail with `no such table: content_search`, the schema migration has not run. Check `backend/schema.sql` and the migration step in `backend/src/app.js`.

### React build fails with `Module not found`

Check that the import path is correct (case-sensitive on Linux) and that the file exists at that path.

### ESLint/Prettier format failure

Run the linter locally to auto-fix:

```sh
npm run lint -- --fix
```

---

## References

- `.github/workflows/ci.yml` — the main CI workflow.
- `CONTRIBUTING.md` — local gate commands.
- `COPILOT-CLI.md` — how to use the `github` MCP server and Copilot CLI agents for CI investigation.
