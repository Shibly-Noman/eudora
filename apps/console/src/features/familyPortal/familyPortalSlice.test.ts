import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiRequestError } from "@/features/auth/authApi"

import reducer, { fetchMyFamily, updateMyContact } from "./familyPortalSlice"
import * as familyPortalApi from "./familyPortalApi"

vi.mock("./familyPortalApi", () => ({
  getMyFamily: vi.fn(),
  updateMyContact: vi.fn(),
}))

function makeStore() {
  return configureStore({
    reducer: {
      familyPortal: reducer,
    },
  })
}

describe("family portal slice", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("loads scoped family portal data", async () => {
    vi.mocked(familyPortalApi.getMyFamily).mockResolvedValue({
      guardian: { id: "guardian_1", firstName: "Amina", lastName: "Rahman", email: "amina@example.com", phone: null },
      families: [{ id: "family_1", familyCode: "FAM-001", displayName: "Rahman Family", primaryEmail: null, primaryPhone: null }],
      students: [],
    })
    const store = makeStore()

    await store.dispatch(fetchMyFamily())

    expect(store.getState().familyPortal.data?.guardian.id).toBe("guardian_1")
    expect(store.getState().familyPortal.status).toBe("ready")
  })

  it("converts API request failures into serializable error payloads", async () => {
    vi.mocked(familyPortalApi.getMyFamily).mockRejectedValue(
      new ApiRequestError(403, "No guardian profile is linked to this account", "FORBIDDEN")
    )
    const store = makeStore()

    const result = await store.dispatch(fetchMyFamily())

    expect(result.payload).toEqual({
      status: 403,
      message: "No guardian profile is linked to this account",
      code: "FORBIDDEN",
    })
    expect(result.payload).not.toBeInstanceOf(ApiRequestError)
    expect(store.getState().familyPortal.error).toBe("No guardian profile is linked to this account")
  })

  it("updates the loaded guardian contact after a successful self-service save", async () => {
    vi.mocked(familyPortalApi.getMyFamily).mockResolvedValue({
      guardian: { id: "guardian_1", firstName: "Amina", lastName: "Rahman", email: "old@example.com", phone: null },
      families: [],
      students: [],
    })
    vi.mocked(familyPortalApi.updateMyContact).mockResolvedValue({
      id: "guardian_1",
      firstName: "Sara",
      lastName: "Karim",
      email: "new@example.com",
      phone: "01800000000",
    })
    const store = makeStore()

    await store.dispatch(fetchMyFamily())
    await store.dispatch(
      updateMyContact({
        firstName: "Sara",
        lastName: "Karim",
        email: "new@example.com",
        phone: "01800000000",
      })
    )

    expect(familyPortalApi.updateMyContact).toHaveBeenCalledWith({
      firstName: "Sara",
      lastName: "Karim",
      email: "new@example.com",
      phone: "01800000000",
    })
    expect(store.getState().familyPortal.data?.guardian).toMatchObject({
      firstName: "Sara",
      lastName: "Karim",
      email: "new@example.com",
      phone: "01800000000",
    })
    expect(store.getState().familyPortal.saving).toBe(false)
  })
})
