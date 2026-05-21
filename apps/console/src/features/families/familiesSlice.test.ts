import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import reducer, {
  addGuardianToFamily,
  addStudentToFamily,
  createFamilyWizard,
  createGuardianLogin,
  fetchFamilyDetail,
  updateFamily,
  updateRelationship,
} from "./familiesSlice"
import * as familiesApi from "./familiesApi"

vi.mock("./familiesApi", () => ({
  createFamilyWizard: vi.fn(),
  createGuardianLogin: vi.fn(),
  getFamilyDetail: vi.fn(),
  addGuardianToFamily: vi.fn(),
  addStudentToFamily: vi.fn(),
  updateFamily: vi.fn(),
  updateGuardianStudentRelationship: vi.fn(),
}))

function makeStore() {
  return configureStore({
    reducer: {
      families: reducer,
    },
  })
}

describe("families slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("stores the result of the guided family wizard", async () => {
    vi.mocked(familiesApi.createFamilyWizard).mockResolvedValue({
      family: { id: "family_1", familyCode: "FAM-001", displayName: "Rahman Family" },
      guardian: { id: "guardian_1", firstName: "Amina", lastName: "Rahman" },
      student: { id: "student_1", studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman" },
      primaryPlacement: { id: "placement_1" },
    })
    const store = makeStore()

    await store.dispatch(
      createFamilyWizard({
        family: { familyCode: "FAM-001", displayName: "Rahman Family" },
        guardian: { firstName: "Amina", lastName: "Rahman" },
        student: { studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman" },
        relationship: { relationshipType: "mother" },
      })
    )

    expect(store.getState().families.lastCreated?.family.id).toBe("family_1")
    expect(store.getState().families.status).toBe("ready")
  })

  it("stores family detail workspace data", async () => {
    vi.mocked(familiesApi.getFamilyDetail).mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: "family@example.com",
      primaryPhone: null,
      guardians: [],
      students: [],
      activity: [],
    })
    const store = makeStore()

    await store.dispatch(fetchFamilyDetail("family_1"))

    expect(store.getState().families.selectedFamily?.id).toBe("family_1")
  })

  it("stores one-time guardian login credentials", async () => {
    vi.mocked(familiesApi.createGuardianLogin).mockResolvedValue({
      guardianId: "guardian_1",
      userId: "user_1",
      email: "guardian@example.com",
      temporaryPassword: "Eudora-temp",
      mustChangePassword: true,
    })
    const store = makeStore()

    await store.dispatch(createGuardianLogin("guardian_1"))

    expect(store.getState().families.lastGuardianLogin?.temporaryPassword).toBe("Eudora-temp")
  })

  it("updates a relationship inside selected family detail", async () => {
    vi.mocked(familiesApi.getFamilyDetail).mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: null,
      primaryPhone: null,
      guardians: [
        {
          id: "guardian_1",
          firstName: "Amina",
          lastName: "Rahman",
          email: "guardian@example.com",
          userId: "user_1",
          isPrimary: true,
          portalStatus: "linked_portal_disabled",
          relationships: [{ id: "relationship_1", studentId: "student_1", hasPortalAccess: false }],
        },
      ],
      students: [],
      activity: [],
    })
    vi.mocked(familiesApi.updateGuardianStudentRelationship).mockResolvedValue({
      id: "relationship_1",
      guardianId: "guardian_1",
      studentId: "student_1",
      hasPortalAccess: true,
    })
    const store = makeStore()

    await store.dispatch(fetchFamilyDetail("family_1"))
    await store.dispatch(updateRelationship({ id: "relationship_1", input: { hasPortalAccess: true } }))

    expect(store.getState().families.selectedFamily?.guardians[0]?.relationships[0]?.hasPortalAccess).toBe(true)
  })

  it("updates selected household details after a staff edit", async () => {
    vi.mocked(familiesApi.getFamilyDetail).mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: null,
      primaryPhone: null,
      guardians: [],
      students: [],
      activity: [],
    })
    vi.mocked(familiesApi.updateFamily).mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household Updated",
      primaryEmail: "family@example.com",
      primaryPhone: "+880100000000",
      addressLine1: "House 12",
      city: "Dhaka",
      status: "active",
    })
    const store = makeStore()

    await store.dispatch(fetchFamilyDetail("family_1"))
    await store.dispatch(
      updateFamily({
        familyId: "family_1",
        input: {
          displayName: "Rahman Household Updated",
          primaryEmail: "family@example.com",
          primaryPhone: "+880100000000",
          addressLine1: "House 12",
          city: "Dhaka",
          status: "active",
        },
      })
    )

    expect(store.getState().families.selectedFamily?.displayName).toBe("Rahman Household Updated")
    expect(store.getState().families.selectedFamily?.addressLine1).toBe("House 12")
  })

  it("adds guardians and students to the selected family workspace", async () => {
    vi.mocked(familiesApi.getFamilyDetail).mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: null,
      primaryPhone: null,
      guardians: [],
      students: [],
      activity: [],
    })
    vi.mocked(familiesApi.addGuardianToFamily).mockResolvedValue({
      id: "guardian_1",
      firstName: "Amina",
      lastName: "Rahman",
      email: "amina@example.com",
    })
    vi.mocked(familiesApi.addStudentToFamily).mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Rahman",
    })
    const store = makeStore()

    await store.dispatch(fetchFamilyDetail("family_1"))
    await store.dispatch(
      addGuardianToFamily({
        familyId: "family_1",
        input: { firstName: "Amina", lastName: "Rahman", email: "amina@example.com" },
      })
    )
    await store.dispatch(
      addStudentToFamily({
        familyId: "family_1",
        input: { studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman" },
      })
    )

    expect(store.getState().families.selectedFamily?.guardians[0]?.id).toBe("guardian_1")
    expect(store.getState().families.selectedFamily?.students[0]?.id).toBe("student_1")
  })
})
