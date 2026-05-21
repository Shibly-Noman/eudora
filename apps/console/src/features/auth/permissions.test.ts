import { describe, expect, it } from "vitest"

import {
  getRequiredPermissions,
  hasEveryPermission,
  isNavItemAllowed,
} from "./permissions"

describe("frontend permissions", () => {
  it("requires every permission for guarded actions", () => {
    expect(hasEveryPermission(["users.read", "users.activate"], ["users.read"])).toBe(true)
    expect(hasEveryPermission(["users.read"], ["users.read", "users.activate"])).toBe(false)
  })

  it("treats unguarded actions as allowed", () => {
    expect(hasEveryPermission([], [])).toBe(true)
    expect(hasEveryPermission(["users.read"], [])).toBe(true)
  })

  it("matches route permissions by exact path and nested path", () => {
    expect(getRequiredPermissions("/users")).toEqual(["users.read"])
    expect(getRequiredPermissions("/users/pending")).toEqual(["users.read"])
    expect(getRequiredPermissions("/roles")).toEqual(["roles.read"])
    expect(getRequiredPermissions("/roles/system")).toEqual(["roles.read"])
    expect(getRequiredPermissions("/education/setup")).toEqual(["education.manageStructure"])
    expect(getRequiredPermissions("/education/campuses")).toEqual(["education.read"])
    expect(getRequiredPermissions("/education/classes")).toEqual(["education.read"])
    expect(getRequiredPermissions("/education/classes/class_1")).toEqual(["education.read"])
    expect(getRequiredPermissions("/families")).toEqual(["families.read"])
    expect(getRequiredPermissions("/families/family_1")).toEqual(["families.read"])
    expect(getRequiredPermissions("/students")).toEqual(["students.read"])
    expect(getRequiredPermissions("/students/student_1")).toEqual(["students.read"])
    expect(getRequiredPermissions("/my-family")).toEqual(["familyPortal.read"])
    expect(getRequiredPermissions("/dashboard")).toEqual([])
  })

  it("allows nav items only when their required permissions are present", () => {
    expect(isNavItemAllowed({ requiredPermissions: ["users.read"] }, ["users.read"])).toBe(true)
    expect(isNavItemAllowed({ requiredPermissions: ["users.read"] }, [])).toBe(false)
    expect(isNavItemAllowed({ requiredPermissions: ["roles.read"] }, ["users.read"])).toBe(false)
    expect(isNavItemAllowed({}, [])).toBe(true)
  })
})
