import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

export type FamilyPortalResponse = {
  guardian: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  families: {
    id: string;
    familyCode: string;
    displayName: string;
    primaryEmail: string | null;
    primaryPhone: string | null;
  }[];
  students: {
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    status: string;
    primaryPlacements: {
      id: string;
      startsOn: Date;
      classSection: {
        id: string;
        code: string;
        name: string;
        campus: { id: string; code: string; name: string };
        program: { id: string; code: string; name: string };
        academicYear: { id: string; code: string; name: string };
      };
    }[];
    courseEnrollments: {
      id: string;
      courseClass: {
        id: string;
        code: string;
        name: string;
      };
    }[];
    relationshipType: string;
    responsibilities: {
      isPrimaryContact: boolean;
      isEmergencyContact: boolean;
      isPickupAuthorized: boolean;
      isBillingResponsible: boolean;
      hasPortalAccess: boolean;
      canApproveRequests: boolean;
    };
  }[];
};

export type FamilyPortalGuardianContact = FamilyPortalResponse["guardian"];

export type UpdateMyContactInput = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
};

@Injectable()
export class FamilyPortalService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaAccess) {}

  async getMyFamily(userId: string): Promise<FamilyPortalResponse> {
    const guardian = await this.prisma.db.guardianProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        families: {
          select: {
            family: {
              select: {
                id: true,
                familyCode: true,
                displayName: true,
                primaryEmail: true,
                primaryPhone: true
              }
            }
          }
        },
        students: {
          where: { hasPortalAccess: true },
          select: {
            relationshipType: true,
            isPrimaryContact: true,
            isEmergencyContact: true,
            isPickupAuthorized: true,
            isBillingResponsible: true,
            hasPortalAccess: true,
            canApproveRequests: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                status: true,
                primaryPlacements: {
                  where: { status: "active" },
                  select: {
                    id: true,
                    startsOn: true,
                    classSection: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        campus: { select: { id: true, code: true, name: true } },
                        program: { select: { id: true, code: true, name: true } },
                        academicYear: { select: { id: true, code: true, name: true } }
                      }
                    }
                  }
                },
                courseEnrollments: {
                  where: { status: "active" },
                  select: {
                    id: true,
                    courseClass: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!guardian) {
      throw new ForbiddenException("No guardian profile is linked to this account");
    }

    return {
      guardian: {
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        phone: guardian.phone
      },
      families: guardian.families.map((assignment) => assignment.family),
      students: guardian.students.map((relationship) => ({
        ...relationship.student,
        relationshipType: relationship.relationshipType,
        responsibilities: {
          isPrimaryContact: relationship.isPrimaryContact,
          isEmergencyContact: relationship.isEmergencyContact,
          isPickupAuthorized: relationship.isPickupAuthorized,
          isBillingResponsible: relationship.isBillingResponsible,
          hasPortalAccess: relationship.hasPortalAccess,
          canApproveRequests: relationship.canApproveRequests
        }
      }))
    };
  }

  async updateMyContact(userId: string, input: UpdateMyContactInput): Promise<FamilyPortalGuardianContact> {
    return this.prisma.db.$transaction(async (tx) => {
      const guardian = await tx.guardianProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      });

      if (!guardian) {
        throw new ForbiddenException("No guardian profile is linked to this account");
      }

      const update: {
        firstName?: string;
        lastName?: string;
        email?: string | null;
        phone?: string | null;
      } = {};
      const changedFields: string[] = [];

      if ("firstName" in input) {
        update.firstName = requireText(input.firstName, "firstName");
        if (update.firstName !== guardian.firstName) {
          changedFields.push("firstName");
        }
      }

      if ("lastName" in input) {
        update.lastName = requireText(input.lastName, "lastName");
        if (update.lastName !== guardian.lastName) {
          changedFields.push("lastName");
        }
      }

      if ("email" in input) {
        update.email = requireEmail(input.email);
        if (update.email !== guardian.email) {
          changedFields.push("email");
        }
      }

      if ("phone" in input) {
        update.phone = emptyToNull(input.phone);
        if (update.phone !== guardian.phone) {
          changedFields.push("phone");
        }
      }

      if (Object.keys(update).length === 0) {
        throw new BadRequestException("At least one contact field is required");
      }

      if (changedFields.length === 0) {
        return {
          id: guardian.id,
          firstName: guardian.firstName,
          lastName: guardian.lastName,
          email: guardian.email,
          phone: guardian.phone
        };
      }

      const nextFirstName = update.firstName ?? guardian.firstName;
      const nextLastName = update.lastName ?? guardian.lastName;
      const userUpdate: { email?: string; name?: string } = {};

      if (changedFields.includes("email")) {
        const existingUser = await tx.user.findUnique({
          where: { email: update.email as string },
          select: { id: true }
        });

        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException("Email is already used by another account");
        }

        userUpdate.email = update.email as string;
      }

      if (changedFields.includes("firstName") || changedFields.includes("lastName")) {
        userUpdate.name = `${nextFirstName} ${nextLastName}`.trim();
      }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate
        });
      }

      const updated = await tx.guardianProfile.update({
        where: { id: guardian.id },
        data: update,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          event: "familyPortal.contact.updated",
          targetType: "guardianProfile",
          targetId: guardian.id,
          metadata: {
            changedFields
          }
        }
      });

      return updated;
    });
  }
}

function requireText(value: string | undefined, field: string): string {
  const text = value?.trim();

  if (!text) {
    throw new BadRequestException(`${field} is required`);
  }

  return text;
}

function requireEmail(value: string | null | undefined): string {
  const email = value?.trim().toLowerCase();

  if (!email) {
    throw new BadRequestException("email is required");
  }

  if (!email.includes("@")) {
    throw new BadRequestException("email must be valid");
  }

  return email;
}

function emptyToNull(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}
