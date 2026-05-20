import { ForbiddenException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

type RoleInput = {
  key: string;
  name: string;
  description?: string;
  permissionKeys: string[];
};

type UpdateRoleInput = {
  name?: string;
  description?: string | null;
  permissionKeys?: string[];
};

export type RoleSummary = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissionKeys: string[];
};

const roleSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  isSystem: true,
  permissions: {
    select: {
      permission: {
        select: {
          key: true
        }
      }
    },
    orderBy: {
      permission: {
        key: "asc" as const
      }
    }
  }
};

@Injectable()
export class RbacService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaAccess) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const assignments = await this.prisma.db.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    key: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return [
      ...new Set(
        assignments.flatMap((assignment) =>
          assignment.role.permissions.map((rolePermission) => rolePermission.permission.key)
        )
      )
    ];
  }

  async listRoles(): Promise<RoleSummary[]> {
    const roles = await this.prisma.db.role.findMany({
      orderBy: { key: "asc" },
      select: roleSelect
    });

    return roles.map(toRoleSummary);
  }

  async createRole(input: RoleInput, actorUserId: string): Promise<RoleSummary> {
    const permissions = await this.resolvePermissions(input.permissionKeys);
    const role = await this.prisma.db.role.create({
      data: {
        key: input.key.trim(),
        name: input.name,
        description: input.description ?? null,
        isSystem: false
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isSystem: true
      }
    });

    await this.prisma.db.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
        assignedById: actorUserId
      })),
      skipDuplicates: true
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "roles.create",
        targetType: "role",
        targetId: role.id,
        metadata: {
          permissionKeys: input.permissionKeys
        }
      }
    });

    return {
      ...role,
      permissionKeys: permissions.map((permission) => permission.key)
    };
  }

  async updateRole(roleId: string, input: UpdateRoleInput, actorUserId: string): Promise<RoleSummary> {
    const permissions = input.permissionKeys ? await this.resolvePermissions(input.permissionKeys) : null;
    const role = await this.prisma.db.role.update({
      where: { id: roleId },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {})
      },
      select: roleSelect
    });

    if (permissions) {
      await this.prisma.db.rolePermission.deleteMany({
        where: { roleId }
      });
      await this.prisma.db.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId,
          permissionId: permission.id,
          assignedById: actorUserId
        })),
        skipDuplicates: true
      });
    }

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "roles.update",
        targetType: "role",
        targetId: role.id,
        metadata: {
          permissionKeys: input.permissionKeys ?? null
        }
      }
    });

    if (!permissions) {
      return toRoleSummary(role);
    }

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissionKeys: permissions.map((permission) => permission.key)
    };
  }

  async listPermissions(): Promise<{ id: string; key: string; description: string | null; isSystem: boolean }[]> {
    return this.prisma.db.permission.findMany({
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        description: true,
        isSystem: true
      }
    });
  }

  private async resolvePermissions(permissionKeys: string[]): Promise<{ id: string; key: string }[]> {
    const uniquePermissionKeys = [...new Set(permissionKeys)];
    const permissions = await this.prisma.db.permission.findMany({
      where: {
        key: {
          in: uniquePermissionKeys
        }
      },
      select: {
        id: true,
        key: true
      }
    });
    const foundPermissionKeys = new Set(permissions.map((permission) => permission.key));
    const missingPermissionKeys = uniquePermissionKeys.filter((key) => !foundPermissionKeys.has(key));

    if (missingPermissionKeys.length > 0) {
      throw new ForbiddenException(`Unknown permission keys: ${missingPermissionKeys.join(", ")}`);
    }

    return permissions;
  }
}

function toRoleSummary(role: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permission: { key: string } }[];
}): RoleSummary {
  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissionKeys: role.permissions.map((rolePermission) => rolePermission.permission.key)
  };
}
