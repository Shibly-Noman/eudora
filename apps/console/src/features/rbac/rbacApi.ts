import { apiFetch } from "@/features/auth/authApi"

import type { CreateRoleInput, PermissionSummary, RoleSummary, UpdateRoleInput } from "./rbacTypes"

export async function listPermissions(): Promise<PermissionSummary[]> {
  return apiFetch<PermissionSummary[]>("/rbac/permissions", {
    method: "GET",
    includeCsrf: false,
  })
}

export async function listRoles(): Promise<RoleSummary[]> {
  return apiFetch<RoleSummary[]>("/rbac/roles", {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createRole(input: CreateRoleInput): Promise<RoleSummary> {
  return apiFetch<RoleSummary>("/rbac/roles", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<RoleSummary> {
  return apiFetch<RoleSummary>(`/rbac/roles/${id}`, {
    method: "PATCH",
    body: input,
    includeCsrf: true,
  })
}
