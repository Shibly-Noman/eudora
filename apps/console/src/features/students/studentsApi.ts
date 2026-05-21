import { apiFetch } from "@/features/auth/authApi"
import type { ListQuery, PaginatedResponse } from "@/features/shared/apiTypes"
import { toQueryString } from "@/features/shared/apiTypes"

import type {
  CreateCourseEnrollmentInput,
  ReplacePrimaryPlacementInput,
  StudentCourseEnrollment,
  StudentPrimaryPlacement,
  StudentProfileDetail,
  StudentProfileSummary,
  UpdateStudentInput,
} from "./studentsTypes"

export async function listStudents(query?: ListQuery): Promise<PaginatedResponse<StudentProfileSummary>> {
  return apiFetch<PaginatedResponse<StudentProfileSummary>>(`/students${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function getStudentDetail(id: string): Promise<StudentProfileDetail> {
  return apiFetch<StudentProfileDetail>(`/students/${id}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<StudentProfileSummary> {
  return apiFetch<StudentProfileSummary>(`/students/${id}`, {
    method: "PATCH",
    body: input,
    includeCsrf: true,
  })
}

export async function replacePrimaryPlacement(
  studentId: string,
  input: ReplacePrimaryPlacementInput
): Promise<StudentPrimaryPlacement> {
  return apiFetch<StudentPrimaryPlacement>(`/students/${studentId}/primary-placement`, {
    method: "PUT",
    body: input,
    includeCsrf: true,
  })
}

export async function createCourseEnrollment(
  studentId: string,
  input: CreateCourseEnrollmentInput
): Promise<StudentCourseEnrollment> {
  return apiFetch<StudentCourseEnrollment>(`/students/${studentId}/course-enrollments`, {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}
