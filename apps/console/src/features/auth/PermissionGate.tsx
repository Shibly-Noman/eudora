"use client"

import type { ReactNode } from "react"

import { useAppSelector } from "@/store/hooks"
import { hasEveryPermission, type Permission } from "./permissions"

type PermissionGateProps = {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({
  permissions,
  children,
  fallback = null,
}: PermissionGateProps) {
  const userPermissions = useAppSelector((state) => state.auth.user?.permissions)

  if (!hasEveryPermission(userPermissions, permissions)) {
    return fallback
  }

  return children
}
