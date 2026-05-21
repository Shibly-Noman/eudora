import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import reducer, { createCourseEnrollment, fetchStudentDetail, replacePrimaryPlacement, updateStudent } from "./studentsSlice"
import * as studentsApi from "./studentsApi"

vi.mock("./studentsApi", () => ({
  createCourseEnrollment: vi.fn(),
  getStudentDetail: vi.fn(),
  replacePrimaryPlacement: vi.fn(),
  updateStudent: vi.fn(),
}))

function makeStore() {
  return configureStore({
    reducer: {
      studentProfiles: reducer,
    },
  })
}

describe("students slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("loads selected student detail", async () => {
    vi.mocked(studentsApi.getStudentDetail).mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Rahman",
      status: "active",
      families: [{ id: "family_1", familyCode: "FAM-001", displayName: "Rahman Household", isPrimaryHousehold: true, livesWithFamily: true }],
      guardians: [],
      primaryPlacements: [],
      courseEnrollments: [],
    })
    const store = makeStore()

    await store.dispatch(fetchStudentDetail("student_1"))

    expect(store.getState().studentProfiles.selectedStudent?.id).toBe("student_1")
  })

  it("updates the selected student profile after a staff edit", async () => {
    vi.mocked(studentsApi.getStudentDetail).mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Rahman",
      status: "active",
      families: [],
      guardians: [],
      primaryPlacements: [],
      courseEnrollments: [],
    })
    vi.mocked(studentsApi.updateStudent).mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Karim",
      gender: "female",
      status: "active",
    })
    const store = makeStore()

    await store.dispatch(fetchStudentDetail("student_1"))
    await store.dispatch(updateStudent({ studentId: "student_1", input: { lastName: "Karim", gender: "female" } }))

    expect(store.getState().studentProfiles.selectedStudent?.lastName).toBe("Karim")
    expect(store.getState().studentProfiles.selectedStudent?.gender).toBe("female")
  })

  it("adds placement and course enrollment records to selected student state", async () => {
    vi.mocked(studentsApi.getStudentDetail).mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Rahman",
      status: "active",
      families: [],
      guardians: [],
      primaryPlacements: [],
      courseEnrollments: [],
    })
    vi.mocked(studentsApi.replacePrimaryPlacement).mockResolvedValue({
      id: "placement_1",
      studentId: "student_1",
      classSectionId: "section_1",
      academicYearId: "year_1",
      startsOn: "2026-08-01",
      endsOn: null,
      status: "active",
    })
    vi.mocked(studentsApi.createCourseEnrollment).mockResolvedValue({
      id: "enrollment_1",
      studentId: "student_1",
      courseClassId: "course_1",
      enrolledOn: "2026-08-01",
      endedOn: null,
      status: "active",
    })
    const store = makeStore()

    await store.dispatch(fetchStudentDetail("student_1"))
    await store.dispatch(
      replacePrimaryPlacement({
        studentId: "student_1",
        input: { classSectionId: "section_1", academicYearId: "year_1", startsOn: "2026-08-01", replaceExisting: true },
      })
    )
    await store.dispatch(
      createCourseEnrollment({
        studentId: "student_1",
        input: { courseClassId: "course_1", enrolledOn: "2026-08-01" },
      })
    )

    expect(store.getState().studentProfiles.selectedStudent?.primaryPlacements[0]?.id).toBe("placement_1")
    expect(store.getState().studentProfiles.selectedStudent?.courseEnrollments[0]?.id).toBe("enrollment_1")
  })
})
