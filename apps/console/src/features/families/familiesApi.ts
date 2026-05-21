import { apiFetch } from "@/features/auth/authApi"
import type { ListQuery, PaginatedResponse } from "@/features/shared/apiTypes"
import { toQueryString } from "@/features/shared/apiTypes"

import type {
  AddGuardianInput,
  AddStudentInput,
  CreateFamilyWizardInput,
  CreateFamilyWizardResult,
  FamilyDetail,
  FamilySummary,
  GuardianLoginResult,
  GuardianRelationshipSummary,
  GuardianSummary,
  GuardianUserLinkResult,
  StudentSummary,
  UpdateFamilyInput,
  UpdateRelationshipInput,
} from "./familiesTypes"

export async function listFamilies(query?: ListQuery): Promise<PaginatedResponse<FamilySummary>> {
  return apiFetch<PaginatedResponse<FamilySummary>>(`/families${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function getFamilyDetail(id: string): Promise<FamilyDetail> {
  return apiFetch<FamilyDetail>(`/families/${id}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function listGuardians(query?: ListQuery): Promise<PaginatedResponse<GuardianSummary>> {
  return apiFetch<PaginatedResponse<GuardianSummary>>(`/guardians${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createFamilyWizard(input: CreateFamilyWizardInput): Promise<CreateFamilyWizardResult> {
  return apiFetch<CreateFamilyWizardResult>("/families/wizard", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function updateFamily(id: string, input: UpdateFamilyInput): Promise<FamilySummary> {
  return apiFetch<FamilySummary>(`/families/${id}`, {
    method: "PATCH",
    body: input,
    includeCsrf: true,
  })
}

export async function addGuardianToFamily(familyId: string, input: AddGuardianInput): Promise<GuardianSummary> {
  return apiFetch<GuardianSummary>(`/families/${familyId}/guardians`, {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function addStudentToFamily(familyId: string, input: AddStudentInput): Promise<StudentSummary> {
  return apiFetch<StudentSummary>(`/families/${familyId}/students`, {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function createGuardianLogin(guardianId: string): Promise<GuardianLoginResult> {
  return apiFetch<GuardianLoginResult>(`/guardians/${guardianId}/create-login`, {
    method: "POST",
    includeCsrf: true,
  })
}

export async function linkGuardianUser(guardianId: string, userId: string): Promise<GuardianUserLinkResult> {
  return apiFetch<GuardianUserLinkResult>(`/guardians/${guardianId}/link-user`, {
    method: "POST",
    body: { userId },
    includeCsrf: true,
  })
}

export async function updateGuardianStudentRelationship(
  id: string,
  input: UpdateRelationshipInput
): Promise<GuardianRelationshipSummary> {
  return apiFetch<GuardianRelationshipSummary>(`/guardian-student-relationships/${id}`, {
    method: "PATCH",
    body: input,
    includeCsrf: true,
  })
}
