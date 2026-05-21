import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

type PrismaAccess = Pick<PrismaService, "db">;
type PrimaryPlacementDb = Pick<PrismaAccess["db"], "auditLog" | "classSection" | "studentPrimaryPlacement">;

const primaryPlacementSelect = {
  id: true,
  studentId: true,
  classSectionId: true,
  academicYearId: true,
  startsOn: true,
  endsOn: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

const courseEnrollmentSelect = {
  id: true,
  studentId: true,
  courseClassId: true,
  enrolledOn: true,
  endedOn: true,
  status: true,
  createdAt: true,
  updatedAt: true
};

export type PrimaryPlacementRecord = {
  id: string;
  studentId: string;
  classSectionId: string;
  academicYearId: string;
  startsOn: Date;
  endsOn: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseEnrollmentRecord = {
  id: string;
  studentId: string;
  courseClassId: string;
  enrolledOn: Date;
  endedOn: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class EnrollmentsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaAccess) {}

  async replacePrimaryPlacement(
    studentId: string,
    input: { classSectionId: string; academicYearId: string; startsOn: string; replaceExisting?: boolean },
    actorUserId: string
  ): Promise<PrimaryPlacementRecord> {
    return createPrimaryPlacement(this.prisma.db, studentId, input, actorUserId);
  }

  async createCourseEnrollment(
    studentId: string,
    input: { courseClassId: string; enrolledOn: string },
    actorUserId: string
  ): Promise<CourseEnrollmentRecord> {
    const enrollment = await this.prisma.db.studentCourseEnrollment.create({
      data: {
        studentId: requireText(studentId, "studentId"),
        courseClassId: requireText(input.courseClassId, "courseClassId"),
        enrolledOn: parseDate(input.enrolledOn, "enrolledOn")
      },
      select: courseEnrollmentSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event: "enrollments.course.created",
        targetType: "studentCourseEnrollment",
        targetId: enrollment.id,
        metadata: {
          studentId,
          courseClassId: input.courseClassId
        }
      }
    });

    return enrollment;
  }
}

export async function createPrimaryPlacement(
  db: PrimaryPlacementDb,
  studentId: string,
  input: { classSectionId: string; academicYearId: string; startsOn: string; replaceExisting?: boolean },
  actorUserId: string
): Promise<PrimaryPlacementRecord> {
  const startsOn = parseDate(input.startsOn, "startsOn");
  const existingActivePlacement = await db.studentPrimaryPlacement.findFirst({
    where: {
      studentId,
      academicYearId: input.academicYearId,
      status: "active"
    },
    select: { id: true }
  });

  if (existingActivePlacement) {
    if (!input.replaceExisting) {
      throw new ConflictException("Student already has an active primary placement for this academic year");
    }

    await db.studentPrimaryPlacement.updateMany({
      where: {
        studentId,
        academicYearId: input.academicYearId,
        status: "active"
      },
      data: {
        status: "withdrawn",
        endsOn: startsOn
      }
    });
  }

  const classSection = await db.classSection.findUnique({
    where: { id: input.classSectionId },
    select: {
      id: true,
      academicYearId: true
    }
  });

  if (!classSection) {
    throw new ForbiddenException("Unknown class section");
  }

  if (classSection.academicYearId !== input.academicYearId) {
    throw new ForbiddenException("Class section does not belong to the selected academic year");
  }

  const placement = await db.studentPrimaryPlacement.create({
    data: {
      studentId: requireText(studentId, "studentId"),
      classSectionId: requireText(input.classSectionId, "classSectionId"),
      academicYearId: requireText(input.academicYearId, "academicYearId"),
      startsOn
    },
    select: primaryPlacementSelect
  });

  await db.auditLog.create({
    data: {
      actorUserId,
      event: "enrollments.primaryPlacement.created",
      targetType: "studentPrimaryPlacement",
      targetId: placement.id,
      metadata: {
        studentId,
        classSectionId: input.classSectionId,
        academicYearId: input.academicYearId
      }
    }
  });

  return placement;
}

function requireText(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new BadRequestException(`${field} is required`);
  }
  return trimmed;
}

function parseDate(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid date`);
  }
  return date;
}
