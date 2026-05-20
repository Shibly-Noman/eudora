import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { RbacService } from "./rbac.service.js";

function createPrismaMock() {
  return {
    db: {
      userRole: {
        findMany: vi.fn()
      },
      permission: {
        findMany: vi.fn()
      },
      role: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn()
      },
      rolePermission: {
        deleteMany: vi.fn(),
        createMany: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(createPrismaMock().db))
    }
  };
}

describe("RbacService role management", () => {
  it("lists roles with their assigned permission keys", async () => {
    const prisma = createPrismaMock();
    prisma.db.role.findMany.mockResolvedValue([
      {
        id: "role_admin",
        key: "admin",
        name: "Admin",
        description: "Admin role",
        isSystem: false,
        permissions: [
          { permission: { key: "users.read" } },
          { permission: { key: "users.create" } }
        ]
      }
    ]);

    const service = new RbacService(prisma as never);

    await expect(service.listRoles()).resolves.toEqual([
      {
        id: "role_admin",
        key: "admin",
        name: "Admin",
        description: "Admin role",
        isSystem: false,
        permissionKeys: ["users.read", "users.create"]
      }
    ]);
  });

  it("creates roles from existing permission keys", async () => {
    const prisma = createPrismaMock();
    prisma.db.permission.findMany.mockResolvedValue([
      { id: "permission_users_read", key: "users.read" },
      { id: "permission_users_create", key: "users.create" }
    ]);
    prisma.db.role.create.mockResolvedValue({
      id: "role_admin",
      key: "admin",
      name: "Admin",
      description: "Admin role",
      isSystem: false
    });

    const service = new RbacService(prisma as never);

    const role = await service.createRole(
      {
        key: "admin",
        name: "Admin",
        description: "Admin role",
        permissionKeys: ["users.read", "users.create"]
      },
      "super_1"
    );

    expect(role).toMatchObject({
      id: "role_admin",
      key: "admin",
      name: "Admin"
    });
    expect(prisma.db.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: "role_admin", permissionId: "permission_users_read", assignedById: "super_1" },
        { roleId: "role_admin", permissionId: "permission_users_create", assignedById: "super_1" }
      ],
      skipDuplicates: true
    });
  });

  it("rejects role creation with unknown permission keys", async () => {
    const prisma = createPrismaMock();
    prisma.db.permission.findMany.mockResolvedValue([{ id: "permission_users_read", key: "users.read" }]);

    const service = new RbacService(prisma as never);

    await expect(
      service.createRole(
        {
          key: "admin",
          name: "Admin",
          permissionKeys: ["users.read", "users.delete"]
        },
        "super_1"
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("preserves permission keys when updating role metadata only", async () => {
    const prisma = createPrismaMock();
    prisma.db.role.update.mockResolvedValue({
      id: "role_admin",
      key: "admin",
      name: "Admin",
      description: "Updated role",
      isSystem: false,
      permissions: [{ permission: { key: "users.read" } }]
    });

    const service = new RbacService(prisma as never);

    await expect(service.updateRole("role_admin", { description: "Updated role" }, "super_1")).resolves.toEqual({
      id: "role_admin",
      key: "admin",
      name: "Admin",
      description: "Updated role",
      isSystem: false,
      permissionKeys: ["users.read"]
    });
    expect(prisma.db.rolePermission.deleteMany).not.toHaveBeenCalled();
    expect(prisma.db.rolePermission.createMany).not.toHaveBeenCalled();
  });
});
