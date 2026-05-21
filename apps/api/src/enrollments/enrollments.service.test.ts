import { ConflictException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { EnrollmentsService } from "./enrollments.service.js";

function createPrismaMock() {
  return {
    db: {
      classSection: {
        findUnique: vi.fn()
      },
      studentPrimaryPlacement: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    }
  };
}

describe("EnrollmentsService", () => {
  it("rejects duplicate active primary placement for the same student and academic year", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentPrimaryPlacement.findFirst.mockResolvedValue({ id: "placement_existing" });

    const service = new EnrollmentsService(prisma as never);

    await expect(
      service.replacePrimaryPlacement(
        "student_1",
        { classSectionId: "section_1", academicYearId: "year_1", startsOn: "2026-08-01" },
        "admin_1"
      )
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects placements when the section belongs to a different academic year", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentPrimaryPlacement.findFirst.mockResolvedValue(null);
    prisma.db.classSection.findUnique.mockResolvedValue({ id: "section_1", academicYearId: "year_2" });

    const service = new EnrollmentsService(prisma as never);

    await expect(
      service.replacePrimaryPlacement(
        "student_1",
        { classSectionId: "section_1", academicYearId: "year_1", startsOn: "2026-08-01" },
        "admin_1"
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("replaces an existing active primary placement when explicitly requested", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentPrimaryPlacement.findFirst.mockResolvedValue({ id: "placement_existing" });
    prisma.db.classSection.findUnique.mockResolvedValue({ id: "section_2", academicYearId: "year_1" });
    prisma.db.studentPrimaryPlacement.create.mockResolvedValue({
      id: "placement_2",
      studentId: "student_1",
      classSectionId: "section_2",
      academicYearId: "year_1"
    });

    const service = new EnrollmentsService(prisma as never);
    const placement = await service.replacePrimaryPlacement(
      "student_1",
      {
        classSectionId: "section_2",
        academicYearId: "year_1",
        startsOn: "2026-09-01",
        replaceExisting: true
      },
      "admin_1"
    );

    expect(placement).toMatchObject({ id: "placement_2", classSectionId: "section_2" });
    expect(prisma.db.studentPrimaryPlacement.updateMany).toHaveBeenCalledWith({
      where: {
        studentId: "student_1",
        academicYearId: "year_1",
        status: "active"
      },
      data: {
        status: "withdrawn",
        endsOn: new Date("2026-09-01")
      }
    });
  });
});
