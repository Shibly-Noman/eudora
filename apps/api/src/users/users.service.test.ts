/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { PasswordService } from "../auth/password.service.js";
import { UsersService } from "./users.service.js";

function createPrismaMock() {
  return {
    db: {
      user: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      },
      role: {
        findUnique: vi.fn()
      },
      userRole: {
        deleteMany: vi.fn(),
        findMany: vi.fn(),
        createMany: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    }
  };
}

describe("UsersService", () => {
  it("lists users with assigned role keys", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.findMany.mockResolvedValue([
      {
        id: "user_1",
        email: "person@example.com",
        name: "Person",
        status: "active",
        mustChangePassword: false,
        activatedById: "admin_1",
        roles: [
          { role: { key: "manager", name: "Manager" } },
          { role: { key: "viewer", name: "Viewer" } }
        ]
      }
    ]);

    const service = new UsersService(prisma as never, new PasswordService());

    await expect(service.listUsers()).resolves.toEqual([
      expect.objectContaining({
        id: "user_1",
        roleKeys: ["manager", "viewer"]
      })
    ]);
  });

  it("activates a pending account and records who activated it", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.update.mockResolvedValue({
      id: "user_1",
      email: "person@example.com",
      status: "active",
      activatedById: "admin_1"
    });

    const service = new UsersService(prisma as never, new PasswordService());

    const user = await service.activateUser("user_1", "admin_1");

    expect(user).toMatchObject({
      id: "user_1",
      status: "active",
      activatedById: "admin_1"
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "users.activate",
        targetId: "user_1"
      })
    });
  });

  it("creates superadmin-managed users with a temporary password change requirement", async () => {
    const prisma = createPrismaMock();
    prisma.db.role.findUnique.mockResolvedValue({ id: "role_admin", key: "admin" });
    prisma.db.user.create.mockResolvedValue({
      id: "user_2",
      email: "managed@example.com",
      status: "active",
      mustChangePassword: true
    });

    const service = new UsersService(prisma as never, new PasswordService());

    const user = await service.createManagedUser(
      {
        email: "managed@example.com",
        password: "Temporary Password",
        name: "Managed User",
        roleKeys: ["admin"]
      },
      "super_1"
    );

    expect(user).toMatchObject({
      id: "user_2",
      status: "active",
      mustChangePassword: true,
      roleKeys: ["admin"]
    });
    expect(prisma.db.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user_2", roleId: "role_admin", assignedById: "super_1" }],
      skipDuplicates: true
    });
  });

  it("rejects managed users with unknown role keys", async () => {
    const prisma = createPrismaMock();
    prisma.db.role.findUnique.mockResolvedValue(null);

    const service = new UsersService(prisma as never, new PasswordService());

    await expect(
      service.createManagedUser(
        {
          email: "managed@example.com",
          password: "Temporary Password",
          roleKeys: ["missing"]
        },
        "super_1"
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("replaces roles for an existing user and records an audit entry", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.findUnique.mockResolvedValue({ id: "user_1", email: "person@example.com" });
    prisma.db.role.findUnique
      .mockResolvedValueOnce({ id: "role_manager", key: "manager" })
      .mockResolvedValueOnce({ id: "role_viewer", key: "viewer" });
    prisma.db.userRole.findMany.mockResolvedValue([
      { role: { key: "manager", name: "Manager" } },
      { role: { key: "viewer", name: "Viewer" } }
    ]);

    const service = new UsersService(prisma as never, new PasswordService());

    const roles = await service.replaceUserRoles("user_1", ["manager", "viewer"], "admin_1");

    expect(roles).toEqual([
      { key: "manager", name: "Manager" },
      { key: "viewer", name: "Viewer" }
    ]);
    expect(prisma.db.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: "user_1" } });
    expect(prisma.db.userRole.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "user_1", roleId: "role_manager", assignedById: "admin_1" },
        { userId: "user_1", roleId: "role_viewer", assignedById: "admin_1" }
      ],
      skipDuplicates: true
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "users.roles.updated",
        targetId: "user_1"
      })
    });
  });
});
