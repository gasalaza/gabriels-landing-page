# Squad Team

> gabriels-landing-page

## Coordinator

| Name | Role | Notes |
|------|------|-------|
| Squad | Coordinator | Routes work, enforces handoffs and reviewer gates. |

## Members

| Name | Role | Charter | Status |
|------|------|---------|--------|
| Morpheus | Lead / Architect | .squad/agents/morpheus/charter.md | 🏗️ Active |
| Trinity | Frontend Developer | .squad/agents/trinity/charter.md | ⚛️ Active |
| Tank | Backend Developer | .squad/agents/tank/charter.md | 🔧 Active |
| Switch | Tester / QA | .squad/agents/switch/charter.md | 🧪 Active |
| Neo | Security Engineer | .squad/agents/neo/charter.md | 🔒 Active |
| Scribe | Session Logger | .squad/agents/scribe/charter.md | 📋 Built-in |
| Ralph | Work Monitor | .squad/agents/ralph/charter.md | 🔄 Built-in |
| Rai | RAI Reviewer | .squad/agents/Rai/charter.md | 🛡️ Built-in |
| Fact Checker | Fact Checker | .squad/agents/fact-checker/charter.md | 🔍 Built-in |


## Coding Agent

<!-- copilot-auto-assign: false -->

| Name | Role | Charter | Status |
|------|------|---------|--------|
| @copilot | Coding Agent | — | 🤖 Coding Agent |

### Capabilities

**🟢 Good fit — auto-route when enabled:**
- Bug fixes with clear reproduction steps
- Test coverage (adding missing tests, fixing flaky tests)
- Lint/format fixes and code style cleanup
- Dependency updates and version bumps
- Small isolated features with clear specs
- Boilerplate/scaffolding generation
- Documentation fixes and README updates

**🟡 Needs review — route to @copilot but flag for squad member PR review:**
- Medium features with clear specs and acceptance criteria
- Refactoring with existing test coverage
- API endpoint additions following established patterns
- Migration scripts with well-defined schemas

**🔴 Not suitable — route to squad member instead:**
- Architecture decisions and system design
- Multi-system integration requiring coordination
- Ambiguous requirements needing clarification
- Security-critical changes (auth, encryption, access control)
- Performance-critical paths requiring benchmarking
- Changes requiring cross-team discussion

## Project Context

- **Project:** gabriels-landing-page — Gabriel Salazar's personal portfolio / landing page
- **Requested by:** gasalaza
- **Created:** 2026-07-09
- **Stack:** React 19 + TypeScript + Vite (frontend), Node/Express 5 + better-sqlite3 (backend), Caddy web
- **Scope (now):** Public portfolio (nav, hero, about, CV, stack, services, projects, contact, footer) + a small private admin area behind GitHub OAuth to read contact-form submissions.
- **Deploy:** Railway — private `backend` (Node) + public `web` (Caddy serving the SPA and proxying `/api/*`). Public GitHub repo `gasalaza/gabriels-landing-page`.
- **Reference:** ported 1:1 from Gabriel's existing portfolio (React + Vite), retyped to TypeScript.
- **Cast universe:** The Matrix
