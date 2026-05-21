import { apiFetch } from "@/features/auth/authApi"
import type { ListQuery, PaginatedResponse } from "@/features/shared/apiTypes"
import { toQueryString } from "@/features/shared/apiTypes"

import type {
  AcademicYearSummary,
  CampusSummary,
  ClassSectionRoster,
  ClassSectionSummary,
  CourseClassSummary,
  CreateAcademicYearInput,
  CreateCampusInput,
  CreateClassSectionInput,
  CreateProgramInput,
  ProgramSummary,
} from "./educationTypes"

export async function listCampuses(query?: ListQuery): Promise<PaginatedResponse<CampusSummary>> {
  return apiFetch<PaginatedResponse<CampusSummary>>(`/campuses${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createCampus(input: CreateCampusInput): Promise<CampusSummary> {
  return apiFetch<CampusSummary>("/campuses", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function listPrograms(query?: ListQuery): Promise<PaginatedResponse<ProgramSummary>> {
  return apiFetch<PaginatedResponse<ProgramSummary>>(`/programs${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createProgram(input: CreateProgramInput): Promise<ProgramSummary> {
  return apiFetch<ProgramSummary>("/programs", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function listAcademicYears(query?: ListQuery): Promise<PaginatedResponse<AcademicYearSummary>> {
  return apiFetch<PaginatedResponse<AcademicYearSummary>>(`/academic-years${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createAcademicYear(input: CreateAcademicYearInput): Promise<AcademicYearSummary> {
  return apiFetch<AcademicYearSummary>("/academic-years", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}

export async function listClassSections(query?: ListQuery): Promise<PaginatedResponse<ClassSectionSummary>> {
  return apiFetch<PaginatedResponse<ClassSectionSummary>>(`/class-sections${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function getClassSectionRoster(id: string): Promise<ClassSectionRoster> {
  return apiFetch<ClassSectionRoster>(`/class-sections/${id}/roster`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function listCourseClasses(query?: ListQuery): Promise<PaginatedResponse<CourseClassSummary>> {
  return apiFetch<PaginatedResponse<CourseClassSummary>>(`/course-classes${toQueryString(query)}`, {
    method: "GET",
    includeCsrf: false,
  })
}

export async function createClassSection(input: CreateClassSectionInput): Promise<ClassSectionSummary> {
  return apiFetch<ClassSectionSummary>("/class-sections", {
    method: "POST",
    body: input,
    includeCsrf: true,
  })
}
