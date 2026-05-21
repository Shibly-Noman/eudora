import type { CreateFamilyWizardResult } from "./familiesTypes"

export type FamilyWizardSuccessLink = {
  label: string
  href: string
}

export function buildFamilyWizardSuccessLinks(result: CreateFamilyWizardResult): FamilyWizardSuccessLink[] {
  return [
    {
      label: "Open family workspace",
      href: `/families/${result.family.id}`,
    },
    {
      label: "Open student workspace",
      href: `/students/${result.student.id}`,
    },
  ]
}
