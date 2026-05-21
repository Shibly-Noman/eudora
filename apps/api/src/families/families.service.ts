import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";

import { createPrimaryPlacement, type PrimaryPlacementRecord } from "../enrollments/enrollments.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

type ListQuery = {
  search?: string;
  page?: string | number;
  pageSize?: string | number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type FamilyRecord = {
  id: string;
  familyCode: string;
  displayName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GuardianRecord = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StudentRecord = {
  id: string;
  userId: string | null;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  gender: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FamilyWizardResult = {
  family: FamilyRecord;
  guardian: GuardianRecord;
  student: StudentRecord;
  primaryPlacement: PrimaryPlacementRecord | null;
};

export type GuardianRelationshipRecord = {
  id: string;
  guardianId: string;
  studentId: string;
  relationshipType: string;
  isPrimaryContact: boolean;
  isEmergencyContact: boolean;
  isPickupAuthorized: boolean;
  isBillingResponsible: boolean;
  hasPortalAccess: boolean;
  canApproveRequests: boolean;
};

export type FamilyDetail = FamilyRecord & {
  guardians: Array<
    GuardianRecord & {
      isPrimary: boolean;
      portalStatus: "not_linked" | "linked_portal_disabled" | "linked_portal_active";
      user: { id: string; email: string; status: string; mustChangePassword: boolean } | null;
      relationships: Array<GuardianRelationshipRecord & { studentName: string }>;
    }
  >;
  students: Array<
    StudentRecord & {
      isPrimaryHousehold: boolean;
      livesWithFamily: boolean;
      guardians: Array<
        GuardianRelationshipRecord & {
          guardian: Pick<GuardianRecord, "id" | "firstName" | "lastName" | "email" | "userId">;
        }
      >;
      primaryPlacements: unknown[];
      courseEnrollments: unknown[];
    }
  >;
  activity: Array<{ id: string; event: string; targetType: string | null; targetId: string | null; createdAt: Date }>;
};

export type StudentDetail = StudentRecord & {
  families: Array<Pick<FamilyRecord, "id" | "familyCode" | "displayName"> & { isPrimaryHousehold: boolean; livesWithFamily: boolean }>;
  guardians: Array<
    Pick<GuardianRelationshipRecord, "id" | "relationshipType" | "hasPortalAccess"> & {
      guardian: Pick<GuardianRecord, "id" | "firstName" | "lastName" | "email" | "userId">;
    }
  >;
  primaryPlacements: unknown[];
  courseEnrollments: unknown[];
};

type UpdateFamilyInput = {
  displayName?: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  status?: string;
};

type GuardianStudentRelationshipInput = {
  guardianId?: string;
  studentId?: string;
  relationshipType: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  isPickupAuthorized?: boolean;
  isBillingResponsible?: boolean;
  hasPortalAccess?: boolean;
  canApproveRequests?: boolean;
};

type AddGuardianInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  studentRelationships?: Array<GuardianStudentRelationshipInput & { studentId: string }>;
};

type AddStudentInput = {
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  isPrimaryHousehold?: boolean;
  livesWithFamily?: boolean;
  guardianRelationships?: Array<GuardianStudentRelationshipInput & { guardianId: string }>;
};

type UpdateRelationshipInput = {
  relationshipType?: string;
  isPrimaryContact?: boolean;
  isEmergencyContact?: boolean;
  isPickupAuthorized?: boolean;
  isBillingResponsible?: boolean;
  hasPortalAccess?: boolean;
  canApproveRequests?: boolean;
};

type CreateFamilyWizardInput = {
  family: {
    familyCode: string;
    displayName: string;
    primaryEmail?: string;
    primaryPhone?: string;
  };
  guardian: {
    userId?: string | null;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  student: {
    userId?: string | null;
    studentNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
    gender?: string | null;
  };
  relationship: {
    relationshipType: string;
    isPrimaryContact?: boolean;
    isEmergencyContact?: boolean;
    isPickupAuthorized?: boolean;
    isBillingResponsible?: boolean;
    hasPortalAccess?: boolean;
    canApproveRequests?: boolean;
  };
  primaryPlacement?: {
    classSectionId: string;
    academicYearId: string;
    startsOn: string;
  };
};

const familySelect = {
  id: true,
  familyCode: true,
  displayName: true,
  primaryEmail: true,
  primaryPhone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const guardianSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const studentSelect = {
  id: true,
  userId: true,
  studentNumber: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const relationshipSelect = {
  id: true,
  guardianId: true,
  studentId: true,
  relationshipType: true,
  isPrimaryContact: true,
  isEmergencyContact: true,
  isPickupAuthorized: true,
  isBillingResponsible: true,
  hasPortalAccess: true,
  canApproveRequests: true
};

const studentPlacementSelect = {
  id: true,
  status: true,
  startsOn: true,
  endsOn: true,
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
};

const studentCourseEnrollmentSelect = {
  id: true,
  status: true,
  enrolledOn: true,
  endedOn: true,
  courseClass: {
    select: {
      id: true,
      code: true,
      name: true
    }
  }
};

@Injectable()
export class FamiliesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaAccess) {}

  async listFamilies(query: ListQuery = {}): Promise<Paginated<FamilyRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["familyCode", "displayName", "primaryEmail", "primaryPhone"]);
    const [items, total] = await Promise.all([
      this.prisma.db.family.findMany({
        ...(where ? { where } : {}),
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: familySelect
      }),
      this.prisma.db.family.count({
        ...(where ? { where } : {})
      })
    ]);

    return { items, total, page: pagination.page, pageSize: pagination.pageSize };
  }

  async getFamilyDetail(familyId: string): Promise<FamilyDetail> {
    const family = await this.prisma.db.family.findUnique({
      where: { id: familyId },
      select: {
        ...familySelect,
        guardians: {
          select: {
            isPrimary: true,
            guardian: {
              select: {
                ...guardianSelect,
                user: { select: { id: true, email: true, status: true, mustChangePassword: true } }
              }
            }
          }
        },
        students: {
          select: {
            isPrimaryHousehold: true,
            livesWithFamily: true,
            student: {
              select: {
                ...studentSelect,
                guardians: {
                  select: {
                    ...relationshipSelect,
                    guardian: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } }
                  }
                },
                primaryPlacements: { where: { status: "active" }, select: studentPlacementSelect },
                courseEnrollments: { where: { status: "active" }, select: studentCourseEnrollmentSelect }
              }
            }
          }
        }
      }
    });

    if (!family) {
      throw new NotFoundException("Family not found");
    }

    const activity = await this.prisma.db.auditLog.findMany({
      where: { targetType: "family", targetId: family.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        event: true,
        targetType: true,
        targetId: true,
        createdAt: true
      }
    });

    const students = family.students.map((assignment) => ({
      ...assignment.student,
      isPrimaryHousehold: assignment.isPrimaryHousehold,
      livesWithFamily: assignment.livesWithFamily
    }));

    return {
      ...pickFamilyRecord(family),
      guardians: family.guardians.map((assignment) => {
        const relationships = students.flatMap((student) =>
          student.guardians
            .filter((relationship) => relationship.guardianId === assignment.guardian.id)
            .map((relationship) => ({
              ...toRelationshipRecord(relationship),
              studentName: `${student.firstName} ${student.lastName}`.trim()
            }))
        );

        return {
          ...assignment.guardian,
          isPrimary: assignment.isPrimary,
          portalStatus: getPortalStatus(assignment.guardian.userId, relationships),
          relationships
        };
      }),
      students: students.map((student) => ({
        ...student,
        guardians: student.guardians.map((relationship) => ({
          ...toRelationshipRecord(relationship),
          guardian: relationship.guardian
        })),
        primaryPlacements: student.primaryPlacements,
        courseEnrollments: student.courseEnrollments
      })),
      activity
    };
  }

  async updateFamily(familyId: string, input: UpdateFamilyInput, actorUserId: string): Promise<FamilyRecord> {
    const family = await this.prisma.db.family.update({
      where: { id: familyId },
      data: {
        ...(input.displayName !== undefined ? { displayName: requireText(input.displayName, "displayName") } : {}),
        ...(input.primaryEmail !== undefined ? { primaryEmail: emptyToNull(input.primaryEmail) } : {}),
        ...(input.primaryPhone !== undefined ? { primaryPhone: emptyToNull(input.primaryPhone) } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: emptyToNull(input.addressLine1) } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: emptyToNull(input.addressLine2) } : {}),
        ...(input.city !== undefined ? { city: emptyToNull(input.city) } : {}),
        ...(input.state !== undefined ? { state: emptyToNull(input.state) } : {}),
        ...(input.postalCode !== undefined ? { postalCode: emptyToNull(input.postalCode) } : {}),
        ...(input.country !== undefined ? { country: emptyToNull(input.country) } : {}),
        ...(input.status !== undefined ? { status: normalizeEducationRecordStatus(input.status) } : {})
      },
      select: familySelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "families.updated",
        targetType: "family",
        targetId: family.id
      }
    });

    return family;
  }

  async addGuardianToFamily(familyId: string, input: AddGuardianInput, actorUserId: string): Promise<GuardianRecord> {
    return this.prisma.db.$transaction(async (tx) => {
      const guardian = await tx.guardianProfile.create({
        data: {
          firstName: requireText(input.firstName, "firstName"),
          lastName: requireText(input.lastName, "lastName"),
          email: emptyToNull(input.email),
          phone: emptyToNull(input.phone),
          families: {
            create: {
              familyId,
              isPrimary: input.isPrimary ?? false
            }
          }
        },
        select: guardianSelect
      });

      const relationships = input.studentRelationships ?? [];
      if (relationships.length > 0) {
        await tx.guardianStudentRelationship.createMany({
          data: relationships.map((relationship) =>
            relationshipData({
              ...relationship,
              guardianId: guardian.id
            })
          ),
          skipDuplicates: true
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          event: "families.guardian.added",
          targetType: "family",
          targetId: familyId,
          metadata: { guardianId: guardian.id, relationshipCount: relationships.length }
        }
      });

      return guardian;
    });
  }

  async addStudentToFamily(familyId: string, input: AddStudentInput, actorUserId: string): Promise<StudentRecord> {
    return this.prisma.db.$transaction(async (tx) => {
      const student = await tx.studentProfile.create({
        data: {
          studentNumber: normalizeCode(input.studentNumber),
          firstName: requireText(input.firstName, "firstName"),
          lastName: requireText(input.lastName, "lastName"),
          dateOfBirth: input.dateOfBirth ? parseDate(input.dateOfBirth, "dateOfBirth") : null,
          gender: emptyToNull(input.gender),
          families: {
            create: {
              familyId,
              isPrimaryHousehold: input.isPrimaryHousehold ?? false,
              livesWithFamily: input.livesWithFamily ?? false
            }
          }
        },
        select: studentSelect
      });

      const relationships = input.guardianRelationships ?? [];
      if (relationships.length > 0) {
        await tx.guardianStudentRelationship.createMany({
          data: relationships.map((relationship) =>
            relationshipData({
              ...relationship,
              studentId: student.id
            })
          ),
          skipDuplicates: true
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId,
          event: "families.student.added",
          targetType: "family",
          targetId: familyId,
          metadata: { studentId: student.id, relationshipCount: relationships.length }
        }
      });

      return student;
    });
  }

  async listGuardians(query: ListQuery = {}): Promise<Paginated<GuardianRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["firstName", "lastName", "email", "phone"]);
    const [items, total] = await Promise.all([
      this.prisma.db.guardianProfile.findMany({
        ...(where ? { where } : {}),
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: guardianSelect
      }),
      this.prisma.db.guardianProfile.count({
        ...(where ? { where } : {})
      })
    ]);

    return { items, total, page: pagination.page, pageSize: pagination.pageSize };
  }

  async listStudents(query: ListQuery = {}): Promise<Paginated<StudentRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["studentNumber", "firstName", "lastName"]);
    const [items, total] = await Promise.all([
      this.prisma.db.studentProfile.findMany({
        ...(where ? { where } : {}),
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: studentSelect
      }),
      this.prisma.db.studentProfile.count({
        ...(where ? { where } : {})
      })
    ]);

    return { items, total, page: pagination.page, pageSize: pagination.pageSize };
  }

  async getStudentDetail(studentId: string): Promise<StudentDetail> {
    const student = await this.prisma.db.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        ...studentSelect,
        families: {
          select: {
            isPrimaryHousehold: true,
            livesWithFamily: true,
            family: { select: { id: true, familyCode: true, displayName: true } }
          }
        },
        guardians: {
          select: {
            id: true,
            relationshipType: true,
            hasPortalAccess: true,
            guardian: { select: { id: true, userId: true, firstName: true, lastName: true, email: true } }
          }
        },
        primaryPlacements: {
          orderBy: { startsOn: "desc" },
          select: studentPlacementSelect
        },
        courseEnrollments: {
          orderBy: { enrolledOn: "desc" },
          select: studentCourseEnrollmentSelect
        }
      }
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    return {
      ...student,
      families: student.families.map((assignment) => ({
        ...assignment.family,
        isPrimaryHousehold: assignment.isPrimaryHousehold,
        livesWithFamily: assignment.livesWithFamily
      })),
      guardians: student.guardians.map((relationship) => ({
        id: relationship.id,
        relationshipType: relationship.relationshipType,
        hasPortalAccess: relationship.hasPortalAccess,
        guardian: relationship.guardian
      })),
      primaryPlacements: student.primaryPlacements,
      courseEnrollments: student.courseEnrollments
    };
  }

  async updateStudent(studentId: string, input: Partial<AddStudentInput>, actorUserId: string): Promise<StudentRecord> {
    const student = await this.prisma.db.studentProfile.update({
      where: { id: studentId },
      data: {
        ...(input.firstName !== undefined ? { firstName: requireText(input.firstName, "firstName") } : {}),
        ...(input.lastName !== undefined ? { lastName: requireText(input.lastName, "lastName") } : {}),
        ...(input.dateOfBirth !== undefined
          ? { dateOfBirth: input.dateOfBirth ? parseDate(input.dateOfBirth, "dateOfBirth") : null }
          : {}),
        ...(input.gender !== undefined ? { gender: emptyToNull(input.gender) } : {})
      },
      select: studentSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "students.updated",
        targetType: "studentProfile",
        targetId: student.id
      }
    });

    return student;
  }

  async updateGuardianStudentRelationship(
    relationshipId: string,
    input: UpdateRelationshipInput,
    actorUserId: string
  ): Promise<GuardianRelationshipRecord> {
    const relationship = await this.prisma.db.guardianStudentRelationship.update({
      where: { id: relationshipId },
      data: {
        ...(input.relationshipType !== undefined ? { relationshipType: normalizeRelationship(input.relationshipType) } : {}),
        ...(input.isPrimaryContact !== undefined ? { isPrimaryContact: input.isPrimaryContact } : {}),
        ...(input.isEmergencyContact !== undefined ? { isEmergencyContact: input.isEmergencyContact } : {}),
        ...(input.isPickupAuthorized !== undefined ? { isPickupAuthorized: input.isPickupAuthorized } : {}),
        ...(input.isBillingResponsible !== undefined ? { isBillingResponsible: input.isBillingResponsible } : {}),
        ...(input.hasPortalAccess !== undefined ? { hasPortalAccess: input.hasPortalAccess } : {}),
        ...(input.canApproveRequests !== undefined ? { canApproveRequests: input.canApproveRequests } : {})
      },
      select: relationshipSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "families.relationship.updated",
        targetType: "guardianStudentRelationship",
        targetId: relationship.id,
        metadata: {
          guardianId: relationship.guardianId,
          studentId: relationship.studentId
        }
      }
    });

    return toRelationshipRecord(relationship);
  }

  async createFamilyWizard(input: CreateFamilyWizardInput, actorUserId: string): Promise<FamilyWizardResult> {
    return this.prisma.db.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          familyCode: normalizeCode(input.family.familyCode),
          displayName: requireText(input.family.displayName, "displayName"),
          primaryEmail: emptyToNull(input.family.primaryEmail),
          primaryPhone: emptyToNull(input.family.primaryPhone)
        },
        select: familySelect
      });

      const guardian = await tx.guardianProfile.create({
        data: {
          userId: emptyToNull(input.guardian.userId),
          firstName: requireText(input.guardian.firstName, "guardian.firstName"),
          lastName: requireText(input.guardian.lastName, "guardian.lastName"),
          email: emptyToNull(input.guardian.email),
          phone: emptyToNull(input.guardian.phone)
        },
        select: guardianSelect
      });

      const student = await tx.studentProfile.create({
        data: {
          userId: emptyToNull(input.student.userId),
          studentNumber: normalizeCode(input.student.studentNumber),
          firstName: requireText(input.student.firstName, "student.firstName"),
          lastName: requireText(input.student.lastName, "student.lastName"),
          dateOfBirth: input.student.dateOfBirth ? parseDate(input.student.dateOfBirth, "student.dateOfBirth") : null,
          gender: emptyToNull(input.student.gender)
        },
        select: studentSelect
      });

      await tx.familyGuardian.create({
        data: {
          familyId: family.id,
          guardianId: guardian.id,
          isPrimary: input.relationship.isPrimaryContact ?? true
        }
      });
      await tx.familyStudent.create({
        data: {
          familyId: family.id,
          studentId: student.id,
          isPrimaryHousehold: true,
          livesWithFamily: true
        }
      });
      await tx.guardianStudentRelationship.create({
        data: {
          guardianId: guardian.id,
          studentId: student.id,
          relationshipType: normalizeRelationship(input.relationship.relationshipType),
          isPrimaryContact: input.relationship.isPrimaryContact ?? false,
          isEmergencyContact: input.relationship.isEmergencyContact ?? false,
          isPickupAuthorized: input.relationship.isPickupAuthorized ?? false,
          isBillingResponsible: input.relationship.isBillingResponsible ?? false,
          hasPortalAccess: input.relationship.hasPortalAccess ?? false,
          canApproveRequests: input.relationship.canApproveRequests ?? false
        }
      });

      const primaryPlacement = input.primaryPlacement
        ? await createPrimaryPlacement(tx, student.id, input.primaryPlacement, actorUserId)
        : null;

      await tx.auditLog.create({
        data: {
          actorUserId,
          event: "families.wizard.created",
          targetType: "family",
          targetId: family.id,
          metadata: {
            guardianId: guardian.id,
            studentId: student.id
          }
        }
      });

      return { family, guardian, student, primaryPlacement };
    });
  }

}

function pickFamilyRecord(family: FamilyRecord): FamilyRecord {
  return {
    id: family.id,
    familyCode: family.familyCode,
    displayName: family.displayName,
    primaryEmail: family.primaryEmail,
    primaryPhone: family.primaryPhone,
    addressLine1: family.addressLine1,
    addressLine2: family.addressLine2,
    city: family.city,
    state: family.state,
    postalCode: family.postalCode,
    country: family.country,
    status: family.status,
    createdAt: family.createdAt,
    updatedAt: family.updatedAt
  };
}

function toRelationshipRecord(relationship: GuardianRelationshipRecord): GuardianRelationshipRecord {
  return {
    id: relationship.id,
    guardianId: relationship.guardianId,
    studentId: relationship.studentId,
    relationshipType: relationship.relationshipType,
    isPrimaryContact: relationship.isPrimaryContact,
    isEmergencyContact: relationship.isEmergencyContact,
    isPickupAuthorized: relationship.isPickupAuthorized,
    isBillingResponsible: relationship.isBillingResponsible,
    hasPortalAccess: relationship.hasPortalAccess,
    canApproveRequests: relationship.canApproveRequests
  };
}

function getPortalStatus(
  userId: string | null,
  relationships: Array<Pick<GuardianRelationshipRecord, "hasPortalAccess">>
): "not_linked" | "linked_portal_disabled" | "linked_portal_active" {
  if (!userId) {
    return "not_linked";
  }

  return relationships.some((relationship) => relationship.hasPortalAccess) ? "linked_portal_active" : "linked_portal_disabled";
}

function normalizePagination(query: ListQuery): { page: number; pageSize: number; skip: number } {
  const page = clampNumber(query.page, 1, 1, 100_000);
  const pageSize = clampNumber(query.pageSize, 25, 1, 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function searchWhere(search: string | undefined, fields: string[]): object | undefined {
  const value = search?.trim();
  if (!value) {
    return undefined;
  }

  return {
    OR: fields.map((field) => ({ [field]: { contains: value, mode: "insensitive" } }))
  };
}

function clampNumber(value: string | number | undefined, fallback: number, min: number, max: number): number {
  const numericValue = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numericValue));
}

function normalizeCode(value: string): string {
  return requireText(value, "code").toUpperCase();
}

function requireText(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }
  return trimmed;
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return date;
}

function normalizeRelationship(value: string) {
  const relationship = requireText(value, "relationshipType");
  const allowed = new Set(["mother", "father", "guardian", "grandparent", "sponsor", "other"]);
  if (!allowed.has(relationship)) {
    throw new BadRequestException("relationshipType is invalid");
  }
  return relationship as "mother" | "father" | "guardian" | "grandparent" | "sponsor" | "other";
}

function normalizeEducationRecordStatus(value: string) {
  const status = requireText(value, "status");
  const allowed = new Set(["active", "inactive", "archived"]);
  if (!allowed.has(status)) {
    throw new BadRequestException("status is invalid");
  }
  return status as "active" | "inactive" | "archived";
}

function relationshipData(input: GuardianStudentRelationshipInput & { guardianId: string; studentId: string }) {
  return {
    guardianId: requireText(input.guardianId, "guardianId"),
    studentId: requireText(input.studentId, "studentId"),
    relationshipType: normalizeRelationship(input.relationshipType),
    isPrimaryContact: input.isPrimaryContact ?? false,
    isEmergencyContact: input.isEmergencyContact ?? false,
    isPickupAuthorized: input.isPickupAuthorized ?? false,
    isBillingResponsible: input.isBillingResponsible ?? false,
    hasPortalAccess: input.hasPortalAccess ?? false,
    canApproveRequests: input.canApproveRequests ?? false
  };
}
