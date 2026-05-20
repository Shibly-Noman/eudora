export type AccountStatus =
  | "pending_verification"
  | "active"
  | "rejected"
  | "suspended"

export type UserSummary = {
  id: string
  email: string
  name: string | null
  status: AccountStatus
  mustChangePassword: boolean
  activatedById: string | null
  roleKeys: string[]
}

export type UserRoleSummary = {
  key: string
  name: string
}
