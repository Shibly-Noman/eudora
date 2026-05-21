export type OperationsCounts = {
  campuses: number
  programs: number
  academicYears: number
  classSections: number
  families: number
  students: number
  pendingUsers: number
}

export type OperationsAction = {
  label: string
  href: string
  tone: "setup" | "attention" | "ready"
}

export type ReadinessItem = {
  key: keyof Pick<OperationsCounts, "campuses" | "programs" | "academicYears" | "classSections">
  label: string
  count: number
  ready: boolean
  href: string
}

export type OperationsMetric = {
  key: string
  label: string
  value: number | string
  href: string
}

export type OperationsFlowInput = {
  permissions: string[]
  counts: OperationsCounts
}

export type OperationsFlow = {
  readiness: ReadinessItem[]
  visibleMetrics: OperationsMetric[]
  primaryAction: OperationsAction
}

export function buildOperationsFlow({ permissions, counts }: OperationsFlowInput): OperationsFlow {
  const permissionSet = new Set(permissions)
  const readiness = buildReadiness(counts)
  const visibleMetrics = buildVisibleMetrics(permissionSet, counts)

  return {
    readiness,
    visibleMetrics,
    primaryAction: pickPrimaryAction(permissionSet, counts, readiness),
  }
}

function buildReadiness(counts: OperationsCounts): ReadinessItem[] {
  return [
    {
      key: "campuses",
      label: "Campus",
      count: counts.campuses,
      ready: counts.campuses > 0,
      href: "/education/setup",
    },
    {
      key: "programs",
      label: "Program",
      count: counts.programs,
      ready: counts.programs > 0,
      href: "/education/setup",
    },
    {
      key: "academicYears",
      label: "Academic year",
      count: counts.academicYears,
      ready: counts.academicYears > 0,
      href: "/education/setup",
    },
    {
      key: "classSections",
      label: "Class section",
      count: counts.classSections,
      ready: counts.classSections > 0,
      href: "/education/setup",
    },
  ]
}

function buildVisibleMetrics(permissionSet: Set<string>, counts: OperationsCounts): OperationsMetric[] {
  if (permissionSet.has("familyPortal.read")) {
    return [{ key: "portal", label: "Family portal", value: "Available", href: "/my-family" }]
  }

  const metrics: OperationsMetric[] = []

  if (permissionSet.has("families.read")) {
    metrics.push({ key: "families", label: "Families", value: counts.families, href: "/families" })
  }

  if (permissionSet.has("students.read")) {
    metrics.push({ key: "students", label: "Students", value: counts.students, href: "/students" })
  }

  if (permissionSet.has("users.read")) {
    metrics.push({ key: "pendingUsers", label: "Pending approvals", value: counts.pendingUsers, href: "/users" })
  }

  return metrics
}

function pickPrimaryAction(
  permissionSet: Set<string>,
  counts: OperationsCounts,
  readiness: ReadinessItem[]
): OperationsAction {
  if (permissionSet.has("users.read") && counts.pendingUsers > 0) {
    return { label: "Review pending users", href: "/users", tone: "attention" }
  }

  if (permissionSet.has("familyPortal.read")) {
    return { label: "Open my family", href: "/my-family", tone: "ready" }
  }

  if (permissionSet.has("education.manageStructure") && readiness.some((item) => !item.ready)) {
    return { label: "Complete education setup", href: "/education/setup", tone: "setup" }
  }

  if (permissionSet.has("families.create") || permissionSet.has("families.read")) {
    return {
      label: counts.families > 0 ? "Continue family intake" : "Create first family",
      href: "/families",
      tone: counts.families > 0 ? "ready" : "setup",
    }
  }

  if (permissionSet.has("students.read")) {
    return { label: "Review students", href: "/students", tone: "ready" }
  }

  return { label: "View dashboard", href: "/dashboard", tone: "ready" }
}
