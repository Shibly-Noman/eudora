export type Permission = string

export const protectedRoutes: Record<string, Permission[]> = {
  "/education/setup": ["education.manageStructure"],
  "/education": ["education.read"],
  "/families": ["families.read"],
  "/my-family": ["familyPortal.read"],
  "/roles": ["roles.read"],
  "/students": ["students.read"],
  "/users": ["users.read"],
}

export function hasEveryPermission(
  userPermissions: readonly Permission[] | undefined,
  requiredPermissions: readonly Permission[]
): boolean {
  if (requiredPermissions.length === 0) {
    return true
  }

  const availablePermissions = new Set(userPermissions ?? [])

  return requiredPermissions.every((permission) => availablePermissions.has(permission))
}

export function getRequiredPermissions(pathname: string): Permission[] {
  const normalizedPathname = normalizePathname(pathname)
  const route = Object.keys(protectedRoutes)
    .sort((left, right) => right.length - left.length)
    .find((path) => normalizedPathname === path || normalizedPathname.startsWith(`${path}/`))

  return route ? protectedRoutes[route] : []
}

export function isNavItemAllowed(item: unknown, userPermissions: readonly Permission[] | undefined): boolean {
  return hasEveryPermission(userPermissions, getItemRequiredPermissions(item))
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function getItemRequiredPermissions(item: unknown): Permission[] {
  if (!item || typeof item !== "object" || !("requiredPermissions" in item)) {
    return []
  }

  const value = item.requiredPermissions

  return Array.isArray(value) ? value.filter((permission): permission is Permission => typeof permission === "string") : []
}
