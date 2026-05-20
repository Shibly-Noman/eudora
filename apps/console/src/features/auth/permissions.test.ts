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
    expect(getRequiredPermissions("/dashboard")).toEqual([])
  })

  it("allows nav items only when their required permissions are present", () => {
    expect(isNavItemAllowed({ requiredPermissions: ["users.read"] }, ["users.read"])).toBe(true)
    expect(isNavItemAllowed({ requiredPermissions: ["users.read"] }, [])).toBe(false)
    expect(isNavItemAllowed({ requiredPermissions: ["roles.read"] }, ["users.read"])).toBe(false)
    expect(isNavItemAllowed({}, [])).toBe(true)
  })
})
