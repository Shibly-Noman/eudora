"use client"

import { useEffect, useMemo } from "react"
import { ArrowRight, CheckCircle2, Circle, RefreshCw } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  fetchAcademicYears,
  fetchCampuses,
  fetchClassSections,
  fetchPrograms,
} from "@/features/education/educationSlice"
import { fetchFamilies } from "@/features/families/familiesSlice"
import { buildOperationsFlow } from "@/features/operations/operationsFlow"
import { fetchStudentProfiles } from "@/features/students/studentsSlice"
import { fetchUsers } from "@/features/users/usersSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const education = useAppSelector((state) => state.education)
  const families = useAppSelector((state) => state.families)
  const students = useAppSelector((state) => state.studentProfiles)
  const users = useAppSelector((state) => state.users)
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions])

  useEffect(() => {
    refreshDashboard(dispatch, permissions)
  }, [dispatch, permissions])

  const flow = buildOperationsFlow({
    permissions,
    counts: {
      campuses: education.campuses.length,
      programs: education.programs.length,
      academicYears: education.academicYears.length,
      classSections: education.classSections.length,
      families: families.items.length,
      students: students.items.length,
      pendingUsers: users.items.filter((item) => item.status === "pending_verification").length,
    },
  })

  const canReadEducation = hasAnyPermission(permissions, ["education.read", "education.manageStructure"])
  const isLoading =
    education.status === "loading" ||
    families.status === "loading" ||
    students.status === "loading" ||
    users.status === "loading"

  return (
    <div className="@container/main flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Operations</h1>
          <p className="text-muted-foreground text-sm">Continue the setup, intake, academic, and portal work already backed by the system.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refreshDashboard(dispatch, permissions)} disabled={isLoading}>
          <RefreshCw className="size-4" />
          <span className="sr-only">Refresh operations dashboard</span>
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Next best action</h2>
              <p className="text-muted-foreground text-sm">{nextActionCopy(flow.primaryAction.tone)}</p>
            </div>
            <Badge variant={flow.primaryAction.tone === "attention" ? "destructive" : "secondary"}>
              {flow.primaryAction.tone === "setup" ? "Setup" : flow.primaryAction.tone === "attention" ? "Needs review" : "Ready"}
            </Badge>
          </div>
          <Button asChild className="mt-5">
            <Link href={flow.primaryAction.href}>
              {flow.primaryAction.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="text-lg font-semibold">Signed in as</h2>
          <p className="mt-2 text-sm font-medium">{user?.name ?? user?.email}</p>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {permissions.slice(0, 4).map((permission) => (
              <Badge key={permission} variant="outline">
                {permission}
              </Badge>
            ))}
            {permissions.length > 4 ? <Badge variant="secondary">+{permissions.length - 4}</Badge> : null}
          </div>
        </div>
      </section>

      {flow.visibleMetrics.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {flow.visibleMetrics.map((metric) => (
            <Link key={metric.key} href={metric.href} className="rounded-md border p-4 transition-colors hover:bg-muted/50">
              <span className="text-muted-foreground text-sm">{metric.label}</span>
              <span className="mt-2 block text-2xl font-semibold">{metric.value}</span>
            </Link>
          ))}
        </section>
      ) : null}

      {canReadEducation ? (
        <section className="rounded-md border">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Education setup readiness</h2>
            <p className="text-muted-foreground text-sm">These records unlock family intake and student placement.</p>
          </div>
          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
            {flow.readiness.map((item) => (
              <Link key={item.key} href={item.href} className="flex items-center gap-3 border-b p-4 last:border-b-0 sm:border-r xl:border-b-0">
                {item.ready ? <CheckCircle2 className="size-5 text-green-600" /> : <Circle className="text-muted-foreground size-5" />}
                <span className="grid gap-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground text-sm">{item.count} records</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <FlowLink
          title="1. Setup"
          description="Create campuses, programs, academic years, and class sections."
          href="/education/setup"
          allowed={hasAnyPermission(permissions, ["education.manageStructure"])}
        />
        <FlowLink
          title="2. Intake"
          description="Create household, guardian, student, relationship, and placement records."
          href="/families"
          allowed={hasAnyPermission(permissions, ["families.read", "families.create"])}
        />
        <FlowLink
          title="3. Academic"
          description="Review students, adjust placement, and add course enrollments."
          href="/students"
          allowed={hasAnyPermission(permissions, ["students.read"])}
        />
      </section>
    </div>
  )
}

function FlowLink({
  title,
  description,
  href,
  allowed,
}: {
  title: string
  description: string
  href: string
  allowed: boolean
}) {
  if (!allowed) {
    return null
  }

  return (
    <Link href={href} className="rounded-md border p-4 transition-colors hover:bg-muted/50">
      <span className="font-semibold">{title}</span>
      <span className="text-muted-foreground mt-2 block text-sm">{description}</span>
    </Link>
  )
}

function refreshDashboard(dispatch: ReturnType<typeof useAppDispatch>, permissions: string[]) {
  if (hasAnyPermission(permissions, ["education.read", "education.manageStructure"])) {
    void dispatch(fetchCampuses())
    void dispatch(fetchPrograms())
    void dispatch(fetchAcademicYears())
    void dispatch(fetchClassSections())
  }

  if (hasAnyPermission(permissions, ["families.read"])) {
    void dispatch(fetchFamilies())
  }

  if (hasAnyPermission(permissions, ["students.read"])) {
    void dispatch(fetchStudentProfiles())
  }

  if (hasAnyPermission(permissions, ["users.read"])) {
    void dispatch(fetchUsers("pending_verification"))
  }
}

function hasAnyPermission(permissions: readonly string[], required: readonly string[]): boolean {
  return required.some((permission) => permissions.includes(permission))
}

function nextActionCopy(tone: "setup" | "attention" | "ready"): string {
  if (tone === "attention") {
    return "A queue needs a staff decision before the normal flow can continue cleanly."
  }

  if (tone === "setup") {
    return "Start with the prerequisite records that other workflows depend on."
  }

  return "The core setup is available. Continue the next operational task."
}
