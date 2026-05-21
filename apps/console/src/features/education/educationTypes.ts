export type EducationRecordStatus = "active" | "inactive" | "archived"

export type CampusSummary = {
  id: string
  code: string
  name: string
  phone?: string | null
  email?: string | null
  status: EducationRecordStatus
}

export type ProgramSummary = {
  id: string
  campusId: string
  code: string
  name: string
  description?: string | null
  status: EducationRecordStatus
}

export type AcademicYearSummary = {
  id: string
  code: string
  name: string
  startsOn: string
  endsOn: string
  isActive: boolean
}

export type ClassSectionSummary = {
  id: string
  campusId: string
  programId: string
  academicYearId: string
  termId?: string | null
  code: string
  name: string
  capacity?: number | null
  status: EducationRecordStatus
}

export type CourseClassSummary = ClassSectionSummary

export type ClassSectionRoster = {
  id: string
  code: string
  name: string
  capacity?: number | null
  campus: { id: string; code: string; name: string }
  program: { id: string; code: string; name: string }
  academicYear: { id: string; code: string; name: string }
  students: Array<{
    id: string
    studentNumber: string
    firstName: string
    lastName: string
    placementId?: string
    startsOn?: string
    family?: {
      id: string
      familyCode: string
      displayName: string
      primaryEmail?: string | null
      primaryPhone?: string | null
    } | null
    guardians: Array<{
      id: string
      relationshipId?: string
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
      relationshipType?: string
      isPrimaryContact?: boolean
      isEmergencyContact?: boolean
      isPickupAuthorized?: boolean
      isBillingResponsible?: boolean
      hasPortalAccess?: boolean
      canApproveRequests?: boolean
    }>
  }>
}

export type CreateCampusInput = {
  code: string
  name: string
  phone?: string | null
  email?: string | null
}

export type CreateProgramInput = {
  campusId: string
  code: string
  name: string
  description?: string | null
}

export type CreateAcademicYearInput = {
  code: string
  name: string
  startsOn: string
  endsOn: string
  isActive?: boolean
}

export type CreateClassSectionInput = {
  campusId: string
  programId: string
  academicYearId: string
  code: string
  name: string
  capacity?: number | null
}
