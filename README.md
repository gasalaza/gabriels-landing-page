# Gabriel Salazar Landing Page

Personal portfolio for Gabriel Salazar: a React + TypeScript + Vite public frontend with a Node/Express + better-sqlite3 backend.

## Stack

- Frontend: React 19, TypeScript, Vite, Vitest, Testing Library
- Backend: Node 22, Express 5, better-sqlite3, Vitest, Supertest
- Deploy: Railway two-service setup: Caddy web service + private Node backend

## Development

```sh
npm ci
npm run dev
```

## Quality gates

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

Railway runs the backend from `Dockerfile` and the public web service from `Dockerfile.railway-web` with `Caddyfile.railway` proxying `/api/*` to the private backend.
