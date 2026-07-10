# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Frontend / UI | Trinity | React + TS components, portfolio sections (hero/about/CV/projects/contact), admin UI, styling, routing |
| Backend / API / DB | Tank | Node/Express endpoints, better-sqlite3 schema & queries, contact-form pipeline, admin data reads |
| Security | Neo | Threat modeling, secure coding review, input validation, CSP/headers, OAuth admin gate, rate limiting, dependency risk |
| Code review | Morpheus | Review PRs, check quality, suggest improvements |
| Testing | Switch | Write tests, find edge cases, verify fixes, harden tests |
| Architecture & scope | Morpheus | What to build next, trade-offs, decisions |
| Session logging | Scribe | Automatic — never needs routing |
| RAI review | Rai | Content safety, bias checks, credential detection, ethical review |
| Verification / devil's advocate | Fact Checker | Verify claims, challenge plans, pre-mortems |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Cloud Agent vs. CLI Routing

| Capability | Route via | When |
|---|---|---|
| Well-scoped 🟢 backlog issues | Copilot cloud agent (GitHub Issues → branch → PR) | Issue fits the Coding Agent capability profile in `.squad/team.md`; no architecture or security gate needed |
| Architecture decisions 🔴 | CLI → Morpheus | System design, trade-offs, or cross-cutting changes |
| Security-critical changes 🔴 | CLI → Neo | Auth (OAuth admin gate), CSP/headers, input validation, rate limiting |
| Interactive research / exploration | CLI built-in `explore` agent | Read-only repo research; keeps main context clean |
| Build and test runs | CLI built-in `task` agent | Runs `npm test` / `npm run build`; keeps main context clean |
| Pre-PR review | CLI `/review` or `code-review` agent | Run before every PR opening |
| CI failure diagnosis | CLI + `github` MCP | Fetch logs, classify failure, route to right member |

> **Public repo note:** This is a public repo. Never commit secrets; all env vars live in `.env` (gitignored) and Railway. Branch protection on `main` requires the "Test and build" check + 1 review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Switch to write test cases from requirements simultaneously.
7. **Security gate.** Any change to auth, headers/CSP, input handling, or dependencies routes through Neo before merge.
8. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
