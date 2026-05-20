# Authentication and RBAC Design

## Scope

Build a first backend authentication slice for Eudora using email/password login, HTTP-only JWT cookies, database-backed refresh sessions, single-tenant RBAC, account activation, and auth/RBAC audit logs.

## Account Lifecycle

Public signup creates a user in `pending_verification` status. Pending users cannot log in to protected application areas. A superadmin can list accounts and activate or reject them. Email verification is deferred, but the status model keeps room for it later.

Superadmins can also create users directly. These accounts start active by default, receive a temporary password through an operational channel outside v1, and are marked `mustChangePassword` until the user changes it.

## Authentication

Passwords are hashed with Node `crypto.scrypt`. Access and refresh tokens are HMAC-signed JWTs. The API sends access and refresh tokens as HTTP-only cookies, plus a readable CSRF cookie for double-submit checks on unsafe authenticated requests.

Refresh sessions are stored in the database so users can have multiple active devices. Refresh token rotation replaces the stored refresh hash. Logout revokes the current session.

## Bootstrap

The seed script creates system permissions and default roles. An optional protected bootstrap endpoint can create the first superadmin when explicitly enabled by environment variables. The endpoint requires a bootstrap secret and refuses once any user has the `superadmin` role.

## RBAC

Permissions are immutable system keys seeded by code, such as `users.read`, `users.activate`, `roles.update`, and `audit.read`. Superadmins can create and edit roles, then assign seeded permissions to roles. Authorization checks use permissions as the real enforcement unit. Controllers use decorators and guards for normal route protection; services keep critical checks around dangerous actions.

## Audit

The API records security-relevant events: signup, bootstrap, login success/failure, logout, refresh rotation, password changes, account activation/rejection, user creation, role changes, permission assignment changes, and user-role assignment changes.

