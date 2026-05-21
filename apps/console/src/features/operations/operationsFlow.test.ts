import { describe, expect, it } from "vitest"

import { buildOperationsFlow } from "./operationsFlow"

describe("operations flow", () => {
  it("points staff to education setup before family intake when structure is missing", () => {
    const flow = buildOperationsFlow({
      permissions: ["education.manageStructure", "families.create", "families.read"],
      counts: {
        campuses: 0,
        programs: 0,
        academicYears: 0,
        classSections: 0,
        families: 0,
        students: 0,
        pendingUsers: 0,
      },
    })

    expect(flow.primaryAction).toEqual({
      label: "Complete education setup",
      href: "/education/setup",
      tone: "setup",
    })
    expect(flow.readiness.find((item) => item.key === "classSections")?.ready).toBe(false)
  })

  it("prioritizes pending user approvals when the operator can manage users", () => {
    const flow = buildOperationsFlow({
      permissions: ["users.read", "education.read", "families.read", "students.read"],
      counts: {
        campuses: 1,
        programs: 1,
        academicYears: 1,
        classSections: 1,
        families: 3,
        students: 8,
        pendingUsers: 2,
      },
    })

    expect(flow.primaryAction).toEqual({
      label: "Review pending users",
      href: "/users",
      tone: "attention",
    })
  })

  it("routes guardian users directly to their family portal", () => {
    const flow = buildOperationsFlow({
      permissions: ["familyPortal.read", "familyPortal.updateContact"],
      counts: {
        campuses: 0,
        programs: 0,
        academicYears: 0,
        classSections: 0,
        families: 0,
        students: 0,
        pendingUsers: 0,
      },
    })

    expect(flow.primaryAction).toEqual({
      label: "Open my family",
      href: "/my-family",
      tone: "ready",
    })
    expect(flow.visibleMetrics.map((metric) => metric.key)).toEqual(["portal"])
  })
})
