import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import reducer, { activateUser, createManagedUser, fetchUsers } from "./usersSlice"
import * as usersApi from "./usersApi"
import type { UserSummary } from "./usersTypes"

vi.mock("./usersApi", () => ({
  activateUser: vi.fn(),
  createManagedUser: vi.fn(),
  listUsers: vi.fn(),
  rejectUser: vi.fn(),
  replaceUserRoles: vi.fn(),
}))

const pendingUser: UserSummary = {
  id: "user_pending",
  email: "pending@example.com",
  name: "Pending User",
  status: "pending_verification",
  mustChangePassword: false,
  activatedById: null,
  roleKeys: [],
}

function makeStore() {
  return configureStore({
    reducer: {
      users: reducer,
    },
  })
}

describe("users slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("adds a managed user created by an administrator", async () => {
    const createdUser: UserSummary = {
      id: "user_staff",
      email: "staff@example.com",
      name: "Staff User",
      status: "active",
      mustChangePassword: true,
      activatedById: "admin_1",
      roleKeys: ["support"],
    }
    vi.mocked(usersApi.createManagedUser).mockResolvedValue(createdUser)
    const store = makeStore()

    await store.dispatch(
      createManagedUser({
        email: "staff@example.com",
        name: "Staff User",
        password: "temporary-pass",
        roleKeys: ["support"],
      })
    )

    expect(store.getState().users.items).toEqual([createdUser])
    expect(store.getState().users.saving).toBe(false)
    expect(store.getState().users.error).toBeNull()
  })

  it("tracks the user currently being activated", async () => {
    let resolveActivation: (value: UserSummary) => void = () => undefined
    vi.mocked(usersApi.listUsers).mockResolvedValue([pendingUser])
    vi.mocked(usersApi.activateUser).mockReturnValue(
      new Promise<UserSummary>((resolve) => {
        resolveActivation = resolve
      })
    )
    const store = makeStore()

    await store.dispatch(fetchUsers("pending_verification"))
    const activation = store.dispatch(activateUser(pendingUser.id))

    expect(store.getState().users.actionUserIds).toEqual([pendingUser.id])

    resolveActivation({ ...pendingUser, status: "active", activatedById: "admin_1" })
    await activation

    expect(store.getState().users.actionUserIds).toEqual([])
    expect(store.getState().users.items).toEqual([])
  })
})
