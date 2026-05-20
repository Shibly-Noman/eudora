import { ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";

import { PasswordService } from "../auth/password.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

type CreateManagedUserInput = {
  email: string;
  password: string;
  name?: string;
  roleKeys: string[];
};

export type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  mustChangePassword: boolean;
  activatedById: string | null;
  roleKeys: string[];
};

export type UserRoleSummary = {
  key: string;
  name: string;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  mustChangePassword: true,
  activatedById: true,
  roles: {
    select: {
      role: {
        select: {
          key: true,
          name: true
        }
      }
    },
    orderBy: {
      role: {
        key: "asc" as const
      }
    }
  }
};

@Injectable()
export class UsersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaAccess,
    @Inject(PasswordService) private readonly passwordService: PasswordService
  ) {}

  async listUsers(status?: string): Promise<UserSummary[]> {
    const args = {
      orderBy: { createdAt: "desc" as const },
      select: userSelect
    };

    const users = await this.prisma.db.user.findMany({
      ...args,
      ...(status ? { where: { status: status as never } } : {})
    });

    return users.map(toUserSummary);
  }

  async activateUser(userId: string, actorUserId: string): Promise<UserSummary> {
    const user = await this.prisma.db.user.update({
      where: { id: userId },
      data: {
        status: "active",
        activatedAt: new Date(),
        activatedById: actorUserId,
        rejectedAt: null,
        rejectedById: null
      },
      select: userSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "users.activate",
        targetType: "user",
        targetId: userId
      }
    });

    return toUserSummary(user);
  }

  async rejectUser(userId: string, actorUserId: string): Promise<UserSummary> {
    const user = await this.prisma.db.user.update({
      where: { id: userId },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        rejectedById: actorUserId
      },
      select: userSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "users.reject",
        targetType: "user",
        targetId: userId
      }
    });

    return toUserSummary(user);
  }

  async createManagedUser(input: CreateManagedUserInput, actorUserId: string): Promise<UserSummary> {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.db.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const roles = await Promise.all(
      input.roleKeys.map((key) =>
        this.prisma.db.role.findUnique({
          where: { key }
        })
      )
    );

    if (roles.some((role) => !role)) {
      throw new ForbiddenException("Unknown role key");
    }

    const user = await this.prisma.db.user.create({
      data: {
        email,
        name: input.name ?? null,
        passwordHash: await this.passwordService.hash(input.password),
        status: "active",
        emailVerifiedAt: new Date(),
        activatedAt: new Date(),
        activatedById: actorUserId,
        mustChangePassword: true
      },
      select: userSelect
    });

    const resolvedRoles = roles.filter(isPresent);

    await this.prisma.db.userRole.createMany({
      data: resolvedRoles.map((role) => ({
          userId: user.id,
          roleId: role.id,
          assignedById: actorUserId
        })),
      skipDuplicates: true
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "users.create_managed",
        targetType: "user",
        targetId: user.id
      }
    });

    return {
      ...toUserSummary(user),
      roleKeys: resolvedRoles.map((role) => role.key)
    };
  }

  async replaceUserRoles(userId: string, roleKeys: string[], actorUserId: string): Promise<UserRoleSummary[]> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!user) {
      throw new ForbiddenException("Unknown user");
    }

    const roles = await this.resolveRoles(roleKeys);

    await this.prisma.db.userRole.deleteMany({
      where: { userId }
    });
    await this.prisma.db.userRole.createMany({
      data: roles.map((role) => ({
        userId,
        roleId: role.id,
        assignedById: actorUserId
      })),
      skipDuplicates: true
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "users.roles.updated",
        targetType: "user",
        targetId: userId,
        metadata: {
          email: user.email,
          roleKeys
        }
      }
    });

    return this.listUserRoles(userId);
  }

  async listUserRoles(userId: string): Promise<UserRoleSummary[]> {
    const assignments = await this.prisma.db.userRole.findMany({
      where: { userId },
      orderBy: {
        role: {
          key: "asc"
        }
      },
      select: {
        role: {
          select: {
            key: true,
            name: true
          }
        }
      }
    });

    return assignments.map((assignment) => assignment.role);
  }

  private async resolveRoles(roleKeys: string[]): Promise<{ id: string; key: string }[]> {
    const uniqueRoleKeys = [...new Set(roleKeys)];
    const roles = await Promise.all(
      uniqueRoleKeys.map((key) =>
        this.prisma.db.role.findUnique({
          where: { key },
          select: { id: true, key: true }
        })
      )
    );

    if (roles.some((role) => !role)) {
      throw new ForbiddenException("Unknown role key");
    }

    return roles.filter(isPresent);
  }
}

function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function toUserSummary(user: {
  id: string;
  email: string;
  name: string | null;
  status: string;
  mustChangePassword: boolean;
  activatedById: string | null;
  roles?: { role: { key: string } }[];
}): UserSummary {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    activatedById: user.activatedById,
    roleKeys: user.roles?.map((assignment) => assignment.role.key) ?? []
  };
}
