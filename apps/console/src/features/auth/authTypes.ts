export type AccountStatus =
  | "pending_verification"
  | "active"
  | "rejected"
  | "suspended"

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  status: AccountStatus
  mustChangePassword: boolean
  permissions: string[]
}

export type PublicUser = Omit<CurrentUser, "permissions">

export type LoginInput = {
  email: string
  password: string
}

export type SignupInput = {
  name: string
  email: string
  password: string
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type ApiErrorDetail = {
  field?: string
  code: string
  message: string
}

export type ApiError = {
  status: number
  message: string
  code?: string
  errors?: ApiErrorDetail[]
  requestId?: string
}
