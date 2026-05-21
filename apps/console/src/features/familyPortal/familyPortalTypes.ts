export type FamilyPortalData = {
  guardian: {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    phone?: string | null
  }
  families: Array<{
    id: string
    familyCode: string
    displayName: string
    primaryEmail?: string | null
    primaryPhone?: string | null
  }>
  students: Array<{
    id: string
    studentNumber: string
    firstName: string
    lastName: string
    status: string
    relationshipType: string
    responsibilities: {
      isPrimaryContact: boolean
      isEmergencyContact: boolean
      isPickupAuthorized: boolean
      isBillingResponsible: boolean
      hasPortalAccess: boolean
      canApproveRequests: boolean
    }
    primaryPlacements: Array<{
      id: string
      startsOn: string
      classSection: {
        id: string
        code: string
        name: string
        campus: { id: string; code: string; name: string }
        program: { id: string; code: string; name: string }
        academicYear: { id: string; code: string; name: string }
      }
    }>
    courseEnrollments: Array<{
      id: string
      courseClass: {
        id: string
        code: string
        name: string
      }
    }>
  }>
}

export type GuardianContact = FamilyPortalData["guardian"]

export type UpdateGuardianContactInput = {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
}
