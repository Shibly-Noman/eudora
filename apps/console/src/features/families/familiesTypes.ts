export type FamilySummary = {
  id: string
  familyCode: string
  displayName: string
  primaryEmail?: string | null
  primaryPhone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  status?: string
}

export type GuardianSummary = {
  id: string
  userId?: string | null
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  status?: string
}

export type StudentSummary = {
  id: string
  userId?: string | null
  studentNumber: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  gender?: string | null
  status?: string
}

export type PrimaryPlacementSummary = {
  id: string
}

export type GuardianRelationshipSummary = {
  id: string
  guardianId?: string
  studentId?: string
  relationshipType?: string
  isPrimaryContact?: boolean
  isEmergencyContact?: boolean
  isPickupAuthorized?: boolean
  isBillingResponsible?: boolean
  hasPortalAccess?: boolean
  canApproveRequests?: boolean
}

export type FamilyDetail = FamilySummary & {
  status?: string
  guardians: Array<
    GuardianSummary & {
      isPrimary?: boolean
      portalStatus: "not_linked" | "linked_portal_disabled" | "linked_portal_active"
      user?: {
        id: string
        email: string
        status: string
        mustChangePassword: boolean
      } | null
      relationships: Array<GuardianRelationshipSummary & { studentName?: string }>
    }
  >
  students: Array<
    StudentSummary & {
      isPrimaryHousehold?: boolean
      livesWithFamily?: boolean
      guardians: Array<GuardianRelationshipSummary & { guardian: Pick<GuardianSummary, "id" | "firstName" | "lastName" | "email" | "userId"> }>
      primaryPlacements: unknown[]
      courseEnrollments: unknown[]
    }
  >
  activity: Array<{
    id: string
    event: string
    targetType?: string | null
    targetId?: string | null
    createdAt: string
  }>
}

export type GuardianLoginResult = {
  guardianId: string
  userId: string
  email: string
  temporaryPassword: string
  mustChangePassword: boolean
}

export type GuardianUserLinkResult = {
  guardianId: string
  userId: string
  email: string
}

export type UpdateRelationshipInput = {
  relationshipType?: string
  isPrimaryContact?: boolean
  isEmergencyContact?: boolean
  isPickupAuthorized?: boolean
  isBillingResponsible?: boolean
  hasPortalAccess?: boolean
  canApproveRequests?: boolean
}

export type GuardianStudentLinkInput = UpdateRelationshipInput & {
  guardianId?: string
  studentId?: string
  relationshipType: string
}

export type UpdateFamilyInput = {
  displayName?: string
  primaryEmail?: string | null
  primaryPhone?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  status?: string
}

export type AddGuardianInput = {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  isPrimary?: boolean
  studentRelationships?: Array<GuardianStudentLinkInput & { studentId: string }>
}

export type AddStudentInput = {
  studentNumber: string
  firstName: string
  lastName: string
  dateOfBirth?: string | null
  gender?: string | null
  isPrimaryHousehold?: boolean
  livesWithFamily?: boolean
  guardianRelationships?: Array<GuardianStudentLinkInput & { guardianId: string }>
}

export type CreateFamilyWizardInput = {
  family: {
    familyCode: string
    displayName: string
    primaryEmail?: string | null
    primaryPhone?: string | null
  }
  guardian: {
    userId?: string | null
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
  }
  student: {
    userId?: string | null
    studentNumber: string
    firstName: string
    lastName: string
    dateOfBirth?: string | null
    gender?: string | null
  }
  relationship: {
    relationshipType: string
    isPrimaryContact?: boolean
    isEmergencyContact?: boolean
    isPickupAuthorized?: boolean
    isBillingResponsible?: boolean
    hasPortalAccess?: boolean
    canApproveRequests?: boolean
  }
  primaryPlacement?: {
    classSectionId: string
    academicYearId: string
    startsOn: string
  }
}

export type CreateFamilyWizardResult = {
  family: FamilySummary
  guardian: GuardianSummary
  student: StudentSummary
  primaryPlacement: PrimaryPlacementSummary | null
}
