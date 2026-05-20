export const ACCESS_TOKEN_COOKIE = "eudora_access_token";
export const REFRESH_TOKEN_COOKIE = "eudora_refresh_token";
export const CSRF_TOKEN_COOKIE = "eudora_csrf_token";

export const SYSTEM_PERMISSIONS = [
  "users.read",
  "users.create",
  "users.activate",
  "users.reject",
  "users.assignRoles",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.assignPermissions",
  "audit.read"
] as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[number];
