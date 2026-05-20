# Eudora

Lean TypeScript full-stack monorepo scaffold using Corepack, pnpm, Turborepo, Next.js, NestJS, Prisma, PostgreSQL, and Docker Compose.

## Requirements

- Node.js 24.15.0
- Corepack
- Docker with Compose

## Setup

For the usual local development loop, run PostgreSQL in Docker and run the apps on your machine:

```bash
corepack pnpm install
corepack pnpm dev:setup
corepack pnpm dev
```

The API runs on `http://localhost:3001`, Swagger UI is available at `http://localhost:3001/docs`, and the minimal web shell runs on `http://localhost:3000`.

## Docker App Runtime

To run PostgreSQL, the API, and the web shell together in Docker:

```bash
corepack pnpm docker:start
```

Useful Docker shortcuts:

```bash
corepack pnpm docker:ps
corepack pnpm docker:logs
corepack pnpm docker:stop
```

The Docker app runtime exposes the same ports: web on `http://localhost:3000`, API health on `http://localhost:3001/health`, and Swagger UI on `http://localhost:3001/docs`.
