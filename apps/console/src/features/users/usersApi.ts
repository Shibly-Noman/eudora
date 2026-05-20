import { apiFetch } from "@/features/auth/authApi"

import type { UserRoleSummary, UserSummary } from "./usersTypes"

export async function listUsers(status?: string): Promise<UserSummary[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ""

  return apiFetch<UserSummary[]>(`/users${params}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function activateUser(id: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/users/${id}/activate`, {
    method: "PATCH",
    includeCsrf: true,
  })
}

export async function rejectUser(id: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/users/${id}/reject`, {
    method: "PATCH",
    includeCsrf: true,
  })
}

export async function listUserRoles(id: string): Promise<UserRoleSummary[]> {
  return apiFetch<UserRoleSummary[]>(`/users/${id}/roles`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function replaceUserRoles(id: string, roleKeys: string[]): Promise<UserRoleSummary[]> {
  return apiFetch<UserRoleSummary[]>(`/users/${id}/roles`, {
    method: "PUT",
    body: { roleKeys },
    includeCsrf: true,
  })
}
