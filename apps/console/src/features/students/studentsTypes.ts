export type StudentProfileSummary = {
  id: string
  userId?: string | null
  studentNumber: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  gender?: string | null
  status?: string
}

export type StudentPrimaryPlacement = {
  id: string
  studentId?: string
  classSectionId?: string
  academicYearId?: string
  startsOn: string
  endsOn?: string | null
  status: string
  classSection?: {
    id: string
    code: string
    name: string
    campus: { id: string; code: string; name: string }
    program: { id: string; code: string; name: string }
    academicYear: { id: string; code: string; name: string }
  }
}

export type StudentCourseEnrollment = {
  id: string
  studentId?: string
  courseClassId?: string
  enrolledOn: string
  endedOn?: string | null
  status: string
  courseClass?: {
    id: string
    code: string
    name: string
  }
}

export type StudentProfileDetail = StudentProfileSummary & {
  families: Array<{
    id: string
    familyCode: string
    displayName: string
    isPrimaryHousehold?: boolean
    livesWithFamily?: boolean
  }>
  guardians: Array<{
    id: string
    relationshipType?: string
    hasPortalAccess?: boolean
    guardian: {
      id: string
      firstName: string
      lastName: string
      email?: string | null
      userId?: string | null
    }
  }>
  primaryPlacements: StudentPrimaryPlacement[]
  courseEnrollments: StudentCourseEnrollment[]
}

export type UpdateStudentInput = {
  firstName?: string
  lastName?: string
  dateOfBirth?: string | null
  gender?: string | null
}

export type ReplacePrimaryPlacementInput = {
  classSectionId: string
  academicYearId: string
  startsOn: string
  replaceExisting?: boolean
}

export type CreateCourseEnrollmentInput = {
  courseClassId: string
  enrolledOn: string
}
