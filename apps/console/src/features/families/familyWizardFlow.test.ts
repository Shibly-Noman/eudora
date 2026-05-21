import { describe, expect, it } from "vitest"

import { buildFamilyWizardSuccessLinks } from "./familyWizardFlow"

describe("family wizard flow", () => {
  it("offers direct links to the created family and student workspaces", () => {
    const links = buildFamilyWizardSuccessLinks({
      family: { id: "family_1", familyCode: "FAM-001", displayName: "Rahman Family" },
      guardian: { id: "guardian_1", firstName: "Amina", lastName: "Rahman" },
      student: { id: "student_1", studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman" },
      primaryPlacement: { id: "placement_1" },
    })

    expect(links).toEqual([
      { label: "Open family workspace", href: "/families/family_1" },
      { label: "Open student workspace", href: "/students/student_1" },
    ])
  })
})
