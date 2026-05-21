import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

type ListQuery = {
  search?: string;
  page?: number | string;
  pageSize?: number | string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type CampusRecord = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProgramRecord = {
  id: string;
  campusId: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AcademicYearRecord = {
  id: string;
  code: string;
  name: string;
  startsOn: Date;
  endsOn: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TermRecord = {
  id: string;
  academicYearId: string;
  code: string;
  name: string;
  startsOn: Date;
  endsOn: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SectionRecord = {
  id: string;
  campusId: string;
  programId: string;
  academicYearId: string;
  termId: string | null;
  code: string;
  name: string;
  capacity: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassSectionRoster = {
  id: string;
  code: string;
  name: string;
  capacity: number | null;
  campus: { id: string; code: string; name: string };
  program: { id: string; code: string; name: string };
  academicYear: { id: string; code: string; name: string };
  students: Array<{
    id: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    placementId: string;
    startsOn: Date;
    family: {
      id: string;
      familyCode: string;
      displayName: string;
      primaryEmail: string | null;
      primaryPhone: string | null;
    } | null;
    guardians: Array<{
      id: string;
      relationshipId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      relationshipType: string;
      isPrimaryContact: boolean;
      isEmergencyContact: boolean;
      isPickupAuthorized: boolean;
      isBillingResponsible: boolean;
      hasPortalAccess: boolean;
      canApproveRequests: boolean;
    }>;
  }>;
};

const campusSelect = {
  id: true,
  code: true,
  name: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const programSelect = {
  id: true,
  campusId: true,
  code: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const academicYearSelect = {
  id: true,
  code: true,
  name: true,
  startsOn: true,
  endsOn: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

const termSelect = {
  id: true,
  academicYearId: true,
  code: true,
  name: true,
  startsOn: true,
  endsOn: true,
  createdAt: true,
  updatedAt: true
};

const classSectionSelect = {
  id: true,
  campusId: true,
  programId: true,
  academicYearId: true,
  termId: true,
  code: true,
  name: true,
  capacity: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

@Injectable()
export class EducationStructureService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaAccess) {}

  async listCampuses(query: ListQuery = {}): Promise<Paginated<CampusRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.campus.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: campusSelect
      }),
      this.prisma.db.campus.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async createCampus(
    input: { code: string; name: string; phone?: string | null; email?: string | null },
    actorUserId: string
  ): Promise<CampusRecord> {
    const campus = await this.prisma.db.campus.create({
      data: {
        code: normalizeCode(input.code),
        name: requireText(input.name, "name"),
        phone: emptyToNull(input.phone),
        email: emptyToNull(input.email)
      },
      select: campusSelect
    });
    await this.audit(actorUserId, "education.campus.created", "campus", campus.id);
    return campus;
  }

  async updateCampus(
    id: string,
    input: { name?: string; phone?: string | null; email?: string | null },
    actorUserId: string
  ): Promise<CampusRecord> {
    const campus = await this.prisma.db.campus.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.phone !== undefined ? { phone: emptyToNull(input.phone) } : {}),
        ...(input.email !== undefined ? { email: emptyToNull(input.email) } : {})
      },
      select: campusSelect
    });
    await this.audit(actorUserId, "education.campus.updated", "campus", campus.id);
    return campus;
  }

  async listPrograms(query: ListQuery = {}): Promise<Paginated<ProgramRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.program.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: programSelect
      }),
      this.prisma.db.program.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async createProgram(
    input: { campusId: string; code: string; name: string; description?: string | null },
    actorUserId: string
  ): Promise<ProgramRecord> {
    const program = await this.prisma.db.program.create({
      data: {
        campusId: requireText(input.campusId, "campusId"),
        code: normalizeCode(input.code),
        name: requireText(input.name, "name"),
        description: emptyToNull(input.description)
      },
      select: programSelect
    });
    await this.audit(actorUserId, "education.program.created", "program", program.id);
    return program;
  }

  async updateProgram(
    id: string,
    input: { name?: string; description?: string | null },
    actorUserId: string
  ): Promise<ProgramRecord> {
    const program = await this.prisma.db.program.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.description !== undefined ? { description: emptyToNull(input.description) } : {})
      },
      select: programSelect
    });
    await this.audit(actorUserId, "education.program.updated", "program", program.id);
    return program;
  }

  async listAcademicYears(query: ListQuery = {}): Promise<Paginated<AcademicYearRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.academicYear.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: academicYearSelect
      }),
      this.prisma.db.academicYear.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async createAcademicYear(
    input: { code: string; name: string; startsOn: string; endsOn: string; isActive?: boolean },
    actorUserId: string
  ): Promise<AcademicYearRecord> {
    const academicYear = await this.prisma.db.academicYear.create({
      data: {
        code: normalizeCode(input.code),
        name: requireText(input.name, "name"),
        startsOn: parseDate(input.startsOn, "startsOn"),
        endsOn: parseDate(input.endsOn, "endsOn"),
        isActive: input.isActive ?? false
      },
      select: academicYearSelect
    });
    await this.audit(actorUserId, "education.academicYear.created", "academicYear", academicYear.id);
    return academicYear;
  }

  async updateAcademicYear(
    id: string,
    input: { name?: string; startsOn?: string; endsOn?: string; isActive?: boolean },
    actorUserId: string
  ): Promise<AcademicYearRecord> {
    const academicYear = await this.prisma.db.academicYear.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.startsOn !== undefined ? { startsOn: parseDate(input.startsOn, "startsOn") } : {}),
        ...(input.endsOn !== undefined ? { endsOn: parseDate(input.endsOn, "endsOn") } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: academicYearSelect
    });
    await this.audit(actorUserId, "education.academicYear.updated", "academicYear", academicYear.id);
    return academicYear;
  }

  async listTerms(query: ListQuery = {}): Promise<Paginated<TermRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.term.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: termSelect
      }),
      this.prisma.db.term.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async createTerm(
    input: { academicYearId: string; code: string; name: string; startsOn: string; endsOn: string },
    actorUserId: string
  ): Promise<TermRecord> {
    const term = await this.prisma.db.term.create({
      data: {
        academicYearId: requireText(input.academicYearId, "academicYearId"),
        code: normalizeCode(input.code),
        name: requireText(input.name, "name"),
        startsOn: parseDate(input.startsOn, "startsOn"),
        endsOn: parseDate(input.endsOn, "endsOn")
      },
      select: termSelect
    });
    await this.audit(actorUserId, "education.term.created", "term", term.id);
    return term;
  }

  async updateTerm(
    id: string,
    input: { name?: string; startsOn?: string; endsOn?: string },
    actorUserId: string
  ): Promise<TermRecord> {
    const term = await this.prisma.db.term.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.startsOn !== undefined ? { startsOn: parseDate(input.startsOn, "startsOn") } : {}),
        ...(input.endsOn !== undefined ? { endsOn: parseDate(input.endsOn, "endsOn") } : {})
      },
      select: termSelect
    });
    await this.audit(actorUserId, "education.term.updated", "term", term.id);
    return term;
  }

  async listClassSections(query: ListQuery = {}): Promise<Paginated<SectionRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.classSection.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: classSectionSelect
      }),
      this.prisma.db.classSection.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async getClassSectionRoster(classSectionId: string): Promise<ClassSectionRoster> {
    const section = await this.prisma.db.classSection.findUnique({
      where: { id: classSectionId },
      select: {
        id: true,
        code: true,
        name: true,
        capacity: true,
        campus: { select: { id: true, code: true, name: true } },
        program: { select: { id: true, code: true, name: true } },
        academicYear: { select: { id: true, code: true, name: true } },
        primaryPlacements: {
          where: { status: "active" },
          orderBy: { startsOn: "asc" },
          select: {
            id: true,
            startsOn: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                families: {
                  where: { isPrimaryHousehold: true },
                  take: 1,
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
                guardians: {
                  select: {
                    id: true,
                    relationshipType: true,
                    isPrimaryContact: true,
                    isEmergencyContact: true,
                    isPickupAuthorized: true,
                    isBillingResponsible: true,
                    hasPortalAccess: true,
                    canApproveRequests: true,
                    guardian: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
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

    if (!section) {
      throw new BadRequestException("Class section not found");
    }

    return {
      id: section.id,
      code: section.code,
      name: section.name,
      capacity: section.capacity,
      campus: section.campus,
      program: section.program,
      academicYear: section.academicYear,
      students: section.primaryPlacements.map((placement) => ({
        id: placement.student.id,
        studentNumber: placement.student.studentNumber,
        firstName: placement.student.firstName,
        lastName: placement.student.lastName,
        placementId: placement.id,
        startsOn: placement.startsOn,
        family: placement.student.families[0]?.family ?? null,
        guardians: placement.student.guardians.map((relationship) => ({
          id: relationship.guardian.id,
          relationshipId: relationship.id,
          firstName: relationship.guardian.firstName,
          lastName: relationship.guardian.lastName,
          email: relationship.guardian.email,
          phone: relationship.guardian.phone,
          relationshipType: relationship.relationshipType,
          isPrimaryContact: relationship.isPrimaryContact,
          isEmergencyContact: relationship.isEmergencyContact,
          isPickupAuthorized: relationship.isPickupAuthorized,
          isBillingResponsible: relationship.isBillingResponsible,
          hasPortalAccess: relationship.hasPortalAccess,
          canApproveRequests: relationship.canApproveRequests
        }))
      }))
    };
  }

  async createClassSection(input: CreateSectionInput, actorUserId: string): Promise<SectionRecord> {
    const section = await this.prisma.db.classSection.create({
      data: sectionData(input),
      select: classSectionSelect
    });
    await this.audit(actorUserId, "education.classSection.created", "classSection", section.id);
    return section;
  }

  async updateClassSection(
    id: string,
    input: { name?: string; capacity?: number | null },
    actorUserId: string
  ): Promise<SectionRecord> {
    const section = await this.prisma.db.classSection.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {})
      },
      select: classSectionSelect
    });
    await this.audit(actorUserId, "education.classSection.updated", "classSection", section.id);
    return section;
  }

  async listCourseClasses(query: ListQuery = {}): Promise<Paginated<SectionRecord>> {
    const pagination = normalizePagination(query);
    const where = searchWhere(query.search, ["code", "name"]);
    const [items, total] = await Promise.all([
      this.prisma.db.courseClass.findMany({
        ...(where ? { where } : {}),
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: classSectionSelect
      }),
      this.prisma.db.courseClass.count({
        ...(where ? { where } : {})
      })
    ]);

    return toPage(items, total, pagination);
  }

  async createCourseClass(input: CreateSectionInput, actorUserId: string): Promise<SectionRecord> {
    const courseClass = await this.prisma.db.courseClass.create({
      data: sectionData(input),
      select: classSectionSelect
    });
    await this.audit(actorUserId, "education.courseClass.created", "courseClass", courseClass.id);
    return courseClass;
  }

  async updateCourseClass(
    id: string,
    input: { name?: string; capacity?: number | null },
    actorUserId: string
  ): Promise<SectionRecord> {
    const courseClass = await this.prisma.db.courseClass.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {})
      },
      select: classSectionSelect
    });
    await this.audit(actorUserId, "education.courseClass.updated", "courseClass", courseClass.id);
    return courseClass;
  }

  private async audit(actorUserId: string, event: string, targetType: string, targetId: string): Promise<void> {
    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event,
        targetType,
        targetId
      }
    });
  }
}

type CreateSectionInput = {
  campusId: string;
  programId: string;
  academicYearId: string;
  termId?: string | null;
  code: string;
  name: string;
  capacity?: number | null;
};

function sectionData(input: CreateSectionInput) {
  return {
    campusId: requireText(input.campusId, "campusId"),
    programId: requireText(input.programId, "programId"),
    academicYearId: requireText(input.academicYearId, "academicYearId"),
    termId: emptyToNull(input.termId),
    code: normalizeCode(input.code),
    name: requireText(input.name, "name"),
    capacity: input.capacity ?? null
  };
}

function normalizePagination(query: ListQuery): { page: number; pageSize: number; skip: number } {
  const page = clampNumber(query.page, 1, 1, 100_000);
  const pageSize = clampNumber(query.pageSize, 25, 1, 100);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

function toPage<T>(items: T[], total: number, pagination: { page: number; pageSize: number }): Paginated<T> {
  return { items, total, page: pagination.page, pageSize: pagination.pageSize };
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
