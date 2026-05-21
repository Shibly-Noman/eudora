import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import reducer, { fetchCampuses, fetchClassSectionRoster, fetchCourseClasses } from "./educationSlice"
import * as educationApi from "./educationApi"

vi.mock("./educationApi", () => ({
  getClassSectionRoster: vi.fn(),
  listCampuses: vi.fn(),
  listCourseClasses: vi.fn(),
}))

function makeStore() {
  return configureStore({
    reducer: {
      education: reducer,
    },
  })
}

describe("education slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("loads campuses into state", async () => {
    vi.mocked(educationApi.listCampuses).mockResolvedValue({
      items: [{ id: "campus_1", code: "MAIN", name: "Main Campus", status: "active" }],
      total: 1,
      page: 1,
      pageSize: 25,
    })
    const store = makeStore()

    await store.dispatch(fetchCampuses())

    expect(store.getState().education.campuses).toEqual([{ id: "campus_1", code: "MAIN", name: "Main Campus", status: "active" }])
    expect(store.getState().education.status).toBe("ready")
  })

  it("loads a class roster into state", async () => {
    vi.mocked(educationApi.getClassSectionRoster).mockResolvedValue({
      id: "section_1",
      code: "G1-A",
      name: "Grade 1 A",
      campus: { id: "campus_1", code: "MAIN", name: "Main Campus" },
      program: { id: "program_1", code: "PRIMARY", name: "Primary School" },
      academicYear: { id: "year_1", code: "AY2026", name: "Academic Year 2026" },
      students: [{ id: "student_1", studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman", guardians: [] }],
    })
    const store = makeStore()

    await store.dispatch(fetchClassSectionRoster("section_1"))

    expect(store.getState().education.selectedRoster?.students[0]?.id).toBe("student_1")
  })

  it("loads course classes for enrollment assignment", async () => {
    vi.mocked(educationApi.listCourseClasses).mockResolvedValue({
      items: [
        {
          id: "course_1",
          campusId: "campus_1",
          programId: "program_1",
          academicYearId: "year_1",
          code: "MATH-1",
          name: "Math 1",
          status: "active",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    })
    const store = makeStore()

    await store.dispatch(fetchCourseClasses())

    expect(store.getState().education.courseClasses[0]?.id).toBe("course_1")
  })
})
