import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

import { PasswordService } from "../auth/password.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;
type GuardianRoleDb = Pick<PrismaAccess["db"], "role">;

type LinkExistingUserInput = {
  userId: string;
};

export type GuardianLoginResult = {
  guardianId: string;
  userId: string;
  email: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
};

export type GuardianUserLinkResult = {
  guardianId: string;
  userId: string;
  email: string;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  mustChangePassword: true
};

@Injectable()
export class GuardianAccountsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaAccess,
    @Inject(PasswordService) private readonly passwordService: PasswordService
  ) {}

  async createGuardianLogin(guardianId: string, actorUserId: string): Promise<GuardianLoginResult> {
    return this.prisma.db.$transaction(async (tx) => {
      const guardian = await tx.guardianProfile.findUnique({
        where: { id: guardianId },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (!guardian) {
        throw new ForbiddenException("Unknown guardian");
      }
      if (guardian.userId) {
        throw new ConflictException("Guardian is already linked to a user account");
      }

      const email = normalizeEmail(guardian.email);
      if (!email) {
        throw new BadRequestException("Guardian email is required before creating a login");
      }

      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingUser) {
        throw new ConflictException("A user with this email already exists. Link the existing user instead.");
      }

      const role = await this.getGuardianRole(tx);
      const temporaryPassword = createTemporaryPassword();
      const user = await tx.user.create({
        data: {
          email,
          name: `${guardian.firstName} ${guardian.lastName}`.trim(),
          passwordHash: await this.passwordService.hash(temporaryPassword),
          status: "active",
          emailVerifiedAt: new Date(),
          activatedAt: new Date(),
          activatedById: actorUserId,
          mustChangePassword: true
        },
        select: userSelect
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedById: actorUserId
        }
      });
      await tx.guardianProfile.update({
        where: { id: guardian.id },
        data: { userId: user.id },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          event: "guardians.login.created",
          targetType: "guardianProfile",
          targetId: guardian.id,
          metadata: {
            userId: user.id,
            email
          }
        }
      });

      return {
        guardianId: guardian.id,
        userId: user.id,
        email: user.email,
        temporaryPassword,
        mustChangePassword: user.mustChangePassword
      };
    });
  }

  async linkExistingUser(
    guardianId: string,
    input: LinkExistingUserInput,
    actorUserId: string
  ): Promise<GuardianUserLinkResult> {
    return this.prisma.db.$transaction(async (tx) => {
      const guardian = await tx.guardianProfile.findUnique({
        where: { id: guardianId },
        select: {
          id: true,
          userId: true,
          email: true
        }
      });

      if (!guardian) {
        throw new ForbiddenException("Unknown guardian");
      }
      if (guardian.userId) {
        throw new ConflictException("Guardian is already linked to a user account");
      }

      const linkedGuardian = await tx.guardianProfile.findUnique({
        where: { userId: input.userId },
        select: { id: true }
      });

      if (linkedGuardian) {
        throw new ConflictException("User is already linked to another guardian profile");
      }

      const user = await tx.user.findUnique({
        where: { id: requireText(input.userId, "userId") },
        select: {
          id: true,
          email: true,
          status: true
        }
      });

      if (!user || user.status !== "active") {
        throw new ForbiddenException("Guardian user must be an active account");
      }

      const role = await this.getGuardianRole(tx);
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedById: actorUserId
        }
      });
      await tx.guardianProfile.update({
        where: { id: guardian.id },
        data: { userId: user.id },
        select: {
          id: true,
          userId: true,
          email: true
        }
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          event: "guardians.user.linked",
          targetType: "guardianProfile",
          targetId: guardian.id,
          metadata: {
            userId: user.id,
            email: user.email
          }
        }
      });

      return {
        guardianId: guardian.id,
        userId: user.id,
        email: user.email
      };
    });
  }

  private async getGuardianRole(tx: GuardianRoleDb): Promise<{ id: string; key: string }> {
    const role = await tx.role.findUnique({
      where: { key: "guardian" },
      select: { id: true, key: true }
    });

    if (!role) {
      throw new ForbiddenException("Guardian role is not seeded");
    }

    return role;
  }
}

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function createTemporaryPassword(): string {
  return `Eudora-${randomBytes(9).toString("base64url")}`;
}

function requireText(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }
  return trimmed;
}
