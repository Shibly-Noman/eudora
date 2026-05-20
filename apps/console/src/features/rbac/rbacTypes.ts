export type PermissionSummary = {
  id: string
  key: string
  description: string | null
  isSystem: boolean
}

export type RoleSummary = {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  permissionKeys: string[]
}

export type CreateRoleInput = {
  key: string
  name: string
  description?: string | null
  permissionKeys: string[]
}

export type UpdateRoleInput = {
  name?: string
  description?: string | null
  permissionKeys?: string[]
}
