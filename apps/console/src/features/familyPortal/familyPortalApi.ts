import { apiFetch } from "@/features/auth/authApi"

import type { FamilyPortalData, GuardianContact, UpdateGuardianContactInput } from "./familyPortalTypes"

export async function getMyFamily(): Promise<FamilyPortalData> {
  return apiFetch<FamilyPortalData>("/family-portal/me", {
    method: "GET",
    includeCsrf: false,
  })
}

export async function updateMyContact(input: UpdateGuardianContactInput): Promise<GuardianContact> {
  return apiFetch<GuardianContact>("/family-portal/me/contact", {
    method: "PATCH",
    body: input,
    includeCsrf: true,
  })
}
