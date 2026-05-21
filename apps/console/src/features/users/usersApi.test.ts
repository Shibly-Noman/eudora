import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiFetch } from "@/features/auth/authApi"

import { createManagedUser } from "./usersApi"

vi.mock("@/features/auth/authApi", () => ({
  apiFetch: vi.fn(),
}))

describe("users API", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("creates managed users through the authenticated users endpoint", async () => {
    const createdUser = {
      id: "user_1",
      email: "staff@example.com",
      name: "Staff User",
      status: "active" as const,
      mustChangePassword: true,
      activatedById: "admin_1",
      roleKeys: ["support"],
    }
    vi.mocked(apiFetch).mockResolvedValue(createdUser)

    await expect(
      createManagedUser({
        email: "staff@example.com",
        name: "Staff User",
        password: "temporary-pass",
        roleKeys: ["support"],
      })
    ).resolves.toEqual(createdUser)

    expect(apiFetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      body: {
        email: "staff@example.com",
        name: "Staff User",
        password: "temporary-pass",
        roleKeys: ["support"],
      },
      includeCsrf: true,
    })
  })
})
