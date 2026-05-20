# Authentication and RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first backend authentication and single-tenant RBAC slice for Eudora.

**Architecture:** Add Prisma models for users, roles, permissions, sessions, and audit logs. Implement focused Nest modules for auth, users, RBAC, and audit, with permission guards and cookie-based JWT sessions.

**Tech Stack:** NestJS 11, Prisma, PostgreSQL, Vitest, Supertest, Node `crypto`.

---

### Task 1: Schema and Seed Data

**Files:**
- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/db/prisma/seed.ts`

- [ ] Add account, RBAC, session, and audit models.
- [ ] Seed immutable permission keys and default `superadmin` role.
- [ ] Run `corepack pnpm db:generate`.

### Task 2: Auth Core

**Files:**
- Create: `apps/api/src/auth/*.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/auth/auth.service.test.ts`

- [ ] Write failing tests for signup, pending login rejection, and bootstrap superadmin.
- [ ] Implement password hashing, JWT signing/verifying, refresh session persistence, and bootstrap logic.
- [ ] Run `corepack pnpm --filter @eudora/api test`.

### Task 3: RBAC Guards

**Files:**
- Create: `apps/api/src/rbac/*.ts`
- Test: `apps/api/src/rbac/permissions.guard.test.ts`

- [ ] Write failing tests for required permission approval and denial.
- [ ] Implement `@RequirePermissions`, authenticated user request type, JWT guard, and permission guard.
- [ ] Run API tests.

### Task 4: Users and Role Management APIs

**Files:**
- Create: `apps/api/src/users/*.ts`
- Create: `apps/api/src/rbac/rbac.controller.ts`
- Test: `apps/api/src/users/users.service.test.ts`

- [ ] Write failing tests for account activation and superadmin-created users.
- [ ] Implement users and RBAC services/controllers.
- [ ] Run API tests and typecheck.

### Task 5: Verification

**Files:**
- Modify generated files through project scripts only.

- [ ] Run `corepack pnpm db:validate`.
- [ ] Run `corepack pnpm --filter @eudora/api test`.
- [ ] Run `corepack pnpm typecheck`.
- [ ] Run `corepack pnpm lint`.

