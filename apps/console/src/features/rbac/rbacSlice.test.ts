import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import reducer, { createRole, fetchRoles, updateRole } from "./rbacSlice"
import * as rbacApi from "./rbacApi"
import type { RoleSummary } from "./rbacTypes"

vi.mock("./rbacApi", () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
}))

const roles: RoleSummary[] = [
  {
    id: "role-1",
    key: "support",
    name: "Support",
    description: "Support operators",
    isSystem: false,
    permissionKeys: ["users.read"],
  },
]

function makeStore() {
  return configureStore({
    reducer: {
      rbac: reducer,
    },
  })
}

describe("rbac slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("loads roles into state", async () => {
    vi.mocked(rbacApi.listRoles).mockResolvedValue(roles)
    const store = makeStore()

    await store.dispatch(fetchRoles())

    expect(store.getState().rbac.items).toEqual(roles)
    expect(store.getState().rbac.status).toBe("ready")
  })

  it("adds created roles and updates existing roles", async () => {
    const created: RoleSummary = {
      id: "role-2",
      key: "auditor",
      name: "Auditor",
      description: null,
      isSystem: false,
      permissionKeys: ["users.read", "roles.read"],
    }
    const updated: RoleSummary = {
      ...created,
      name: "Compliance Auditor",
      permissionKeys: ["users.read"],
    }
    vi.mocked(rbacApi.createRole).mockResolvedValue(created)
    vi.mocked(rbacApi.updateRole).mockResolvedValue(updated)
    const store = makeStore()

    await store.dispatch(createRole({ key: "auditor", name: "Auditor", permissionKeys: created.permissionKeys }))
    await store.dispatch(updateRole({ id: "role-2", input: { name: "Compliance Auditor", permissionKeys: ["users.read"] } }))

    expect(store.getState().rbac.items).toEqual([updated])
  })
})
