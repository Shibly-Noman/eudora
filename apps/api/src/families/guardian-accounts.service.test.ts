/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { GuardianAccountsService } from "./guardian-accounts.service.js";

function createPrismaMock() {
  const tx = {
    guardianProfile: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    role: {
      findUnique: vi.fn()
    },
    permission: {
      upsert: vi.fn()
    },
    rolePermission: {
      create: vi.fn()
    },
    userRole: {
      create: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  };

  return {
    tx,
    db: {
      ...tx,
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    }
  };
}

describe("GuardianAccountsService", () => {
  it("creates an active guardian login from the guardian profile email and returns the temporary password once", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      userId: null,
      firstName: "Amina",
      lastName: "Rahman",
      email: " Amina@Example.COM "
    });
    prisma.tx.user.findUnique.mockResolvedValue(null);
    prisma.tx.role.findUnique.mockResolvedValue({ id: "role_guardian", key: "guardian" });
    prisma.tx.user.create.mockResolvedValue({
      id: "user_1",
      email: "amina@example.com",
      name: "Amina Rahman",
      status: "active",
      mustChangePassword: true
    });
    prisma.tx.guardianProfile.update.mockResolvedValue({
      id: "guardian_1",
      userId: "user_1",
      firstName: "Amina",
      lastName: "Rahman",
      email: "amina@example.com"
    });

    const passwordService = {
      hash: vi.fn(() => Promise.resolve("hashed-password"))
    };
    const service = new GuardianAccountsService(prisma as never, passwordService as never);
    const result = await service.createGuardianLogin("guardian_1", "admin_1");

    expect(result).toMatchObject({
      guardianId: "guardian_1",
      userId: "user_1",
      email: "amina@example.com",
      mustChangePassword: true
    });
    expect(result.temporaryPassword).toMatch(/^Eudora-/);
    expect(passwordService.hash).toHaveBeenCalledWith(result.temporaryPassword);
    expect(prisma.tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "amina@example.com",
        name: "Amina Rahman",
        passwordHash: "hashed-password",
        status: "active",
        mustChangePassword: true,
        activatedById: "admin_1"
      }),
      select: expect.any(Object)
    });
    expect(prisma.tx.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        roleId: "role_guardian",
        assignedById: "admin_1"
      }
    });
    expect(prisma.tx.guardianProfile.update).toHaveBeenCalledWith({
      where: { id: "guardian_1" },
      data: { userId: "user_1" },
      select: expect.any(Object)
    });
    expect(prisma.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "guardians.login.created",
        targetType: "guardianProfile",
        targetId: "guardian_1"
      })
    });
  });

  it("rejects login creation when the guardian profile has no email", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      userId: null,
      firstName: "Amina",
      lastName: "Rahman",
      email: null
    });

    const service = new GuardianAccountsService(prisma as never, { hash: vi.fn() } as never);

    await expect(service.createGuardianLogin("guardian_1", "admin_1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("links an existing user to a guardian and ensures the guardian role is assigned", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique
      .mockResolvedValueOnce({ id: "guardian_1", userId: null, email: "guardian@example.com" })
      .mockResolvedValueOnce(null);
    prisma.tx.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "guardian@example.com",
      status: "active"
    });
    prisma.tx.role.findUnique.mockResolvedValue({ id: "role_guardian", key: "guardian" });
    prisma.tx.guardianProfile.update.mockResolvedValue({
      id: "guardian_1",
      userId: "user_1",
      email: "guardian@example.com"
    });

    const service = new GuardianAccountsService(prisma as never, { hash: vi.fn() } as never);
    const result = await service.linkExistingUser("guardian_1", { userId: "user_1" }, "admin_1");

    expect(result).toMatchObject({ guardianId: "guardian_1", userId: "user_1", email: "guardian@example.com" });
    expect(prisma.tx.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        roleId: "role_guardian",
        assignedById: "admin_1"
      }
    });
  });

  it("rejects linking a guardian that is already linked to a user", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      userId: "user_existing",
      email: "guardian@example.com"
    });

    const service = new GuardianAccountsService(prisma as never, { hash: vi.fn() } as never);

    await expect(service.linkExistingUser("guardian_1", { userId: "user_1" }, "admin_1")).rejects.toBeInstanceOf(
      ConflictException
    );
  });
});
