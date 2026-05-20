import { describe, expect, it, vi } from "vitest";

import {
  resolveSeedSuperadminConfig,
  seedSuperadmin
} from "./seed-superadmin.js";

type SeedPrisma = Parameters<typeof seedSuperadmin>[0];

function createPrismaMock() {
  return {
    user: {
      create: vi.fn<SeedPrisma["user"]["create"]>(),
      findUnique: vi.fn<SeedPrisma["user"]["findUnique"]>(),
      update: vi.fn<SeedPrisma["user"]["update"]>()
    },
    role: {
      findUnique: vi.fn<SeedPrisma["role"]["findUnique"]>()
    },
    userRole: {
      createMany: vi.fn<SeedPrisma["userRole"]["createMany"]>()
    },
    auditLog: {
      create: vi.fn<SeedPrisma["auditLog"]["create"]>()
    }
  };
}

describe("seed superadmin", () => {
  it("uses safe development defaults but requires explicit production credentials", () => {
    expect(resolveSeedSuperadminConfig({ NODE_ENV: "development" })).toMatchObject({
      email: "admin@example.com",
      name: "Super Admin",
      resetPassword: false
    });

    expect(resolveSeedSuperadminConfig({ NODE_ENV: "production" })).toBeNull();
    expect(
      resolveSeedSuperadminConfig({
        NODE_ENV: "production",
        SEED_SUPERADMIN_EMAIL: "root@example.com",
        SEED_SUPERADMIN_PASSWORD: "RootPass123!"
      })
    ).toMatchObject({
      email: "root@example.com"
    });
  });

  it("creates and assigns the seeded superadmin when no user exists", async () => {
    const prisma = createPrismaMock();
    prisma.role.findUnique.mockResolvedValue({ id: "role_superadmin" });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user_superadmin",
      email: "admin@example.com"
    });

    await seedSuperadmin(prisma, {
      email: "admin@example.com",
      password: "AdminPass123!",
      name: "Super Admin",
      resetPassword: false
    });

    const createInput = prisma.user.create.mock.calls[0]?.[0];
    expect(createInput?.data.email).toBe("admin@example.com");
    expect(createInput?.data.status).toBe("active");
    expect(createInput?.data.mustChangePassword).toBe(false);
    expect(createInput?.data.passwordHash).toMatch(/^scrypt\$/);
    expect(createInput?.select).toEqual({ id: true, email: true });
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user_superadmin", roleId: "role_superadmin", assignedById: "user_superadmin" }],
      skipDuplicates: true
    });
  });

  it("does not reset an existing seeded superadmin password by default", async () => {
    const prisma = createPrismaMock();
    prisma.role.findUnique.mockResolvedValue({ id: "role_superadmin" });
    prisma.user.findUnique.mockResolvedValue({
      id: "user_superadmin",
      email: "admin@example.com"
    });
    prisma.user.update.mockResolvedValue({
      id: "user_superadmin",
      email: "admin@example.com"
    });

    await seedSuperadmin(prisma, {
      email: "admin@example.com",
      password: "AdminPass123!",
      name: "Super Admin",
      resetPassword: false
    });

    const updateInput = prisma.user.update.mock.calls[0]?.[0];
    expect(updateInput?.where).toEqual({ id: "user_superadmin" });
    expect(updateInput?.data).not.toHaveProperty("passwordHash");
    expect(updateInput?.select).toEqual({ id: true, email: true });
  });
});
