import { describe, expect, it, vi } from "vitest";

import {
  resolveSeedEducationDemoConfig,
  seedEducationDemo,
  type SeedEducationDemoPrisma,
  verifySeedEducationDemoPassword
} from "./seed-education-demo.js";

function createPrismaMock() {
  return {
    role: {
      findUnique: vi.fn<SeedEducationDemoPrisma["role"]["findUnique"]>()
    },
    user: {
      upsert: vi.fn<SeedEducationDemoPrisma["user"]["upsert"]>()
    },
    userRole: {
      createMany: vi.fn<SeedEducationDemoPrisma["userRole"]["createMany"]>()
    },
    campus: {
      upsert: vi.fn<SeedEducationDemoPrisma["campus"]["upsert"]>()
    },
    program: {
      upsert: vi.fn<SeedEducationDemoPrisma["program"]["upsert"]>()
    },
    academicYear: {
      upsert: vi.fn<SeedEducationDemoPrisma["academicYear"]["upsert"]>()
    },
    term: {
      upsert: vi.fn<SeedEducationDemoPrisma["term"]["upsert"]>()
    },
    classSection: {
      upsert: vi.fn<SeedEducationDemoPrisma["classSection"]["upsert"]>()
    },
    courseClass: {
      upsert: vi.fn<SeedEducationDemoPrisma["courseClass"]["upsert"]>()
    },
    family: {
      upsert: vi.fn<SeedEducationDemoPrisma["family"]["upsert"]>()
    },
    studentProfile: {
      upsert: vi.fn<SeedEducationDemoPrisma["studentProfile"]["upsert"]>()
    },
    guardianProfile: {
      findFirst: vi.fn<SeedEducationDemoPrisma["guardianProfile"]["findFirst"]>(),
      update: vi.fn<SeedEducationDemoPrisma["guardianProfile"]["update"]>(),
      create: vi.fn<SeedEducationDemoPrisma["guardianProfile"]["create"]>()
    },
    familyGuardian: {
      createMany: vi.fn<SeedEducationDemoPrisma["familyGuardian"]["createMany"]>()
    },
    familyStudent: {
      createMany: vi.fn<SeedEducationDemoPrisma["familyStudent"]["createMany"]>()
    },
    guardianStudentRelationship: {
      createMany: vi.fn<SeedEducationDemoPrisma["guardianStudentRelationship"]["createMany"]>()
    },
    studentPrimaryPlacement: {
      findFirst: vi.fn<SeedEducationDemoPrisma["studentPrimaryPlacement"]["findFirst"]>(),
      update: vi.fn<SeedEducationDemoPrisma["studentPrimaryPlacement"]["update"]>(),
      create: vi.fn<SeedEducationDemoPrisma["studentPrimaryPlacement"]["create"]>()
    },
    studentCourseEnrollment: {
      upsert: vi.fn<SeedEducationDemoPrisma["studentCourseEnrollment"]["upsert"]>()
    },
    auditLog: {
      create: vi.fn<SeedEducationDemoPrisma["auditLog"]["create"]>()
    }
  } satisfies SeedEducationDemoPrisma;
}

describe("seed education demo", () => {
  it("is disabled by default and resolves explicit demo credentials", () => {
    expect(resolveSeedEducationDemoConfig({})).toBeNull();

    expect(
      resolveSeedEducationDemoConfig({
        SEED_EDUCATION_DEMO: "true"
      })
    ).toMatchObject({
      guardianEmail: "guardian.demo@example.edu",
      guardianPassword: "GuardianPass123!"
    });

    expect(
      resolveSeedEducationDemoConfig({
        SEED_EDUCATION_DEMO: "true",
        SEED_DEMO_GUARDIAN_EMAIL: "Family.Demo@Example.EDU ",
        SEED_DEMO_GUARDIAN_PASSWORD: "LocalPass123!"
      })
    ).toMatchObject({
      guardianEmail: "family.demo@example.edu",
      guardianPassword: "LocalPass123!"
    });
  });

  it("creates an idempotent demo bundle with an active guardian login", async () => {
    const prisma = createPrismaMock();
    prisma.role.findUnique.mockResolvedValue({ id: "role_guardian" });
    prisma.user.upsert.mockResolvedValue({ id: "user_guardian", email: "guardian.demo@example.edu" });
    prisma.campus.upsert.mockResolvedValue({ id: "campus_demo", code: "DEMO-MAIN" });
    prisma.program.upsert.mockResolvedValue({ id: "program_demo", code: "DEMO-PRIMARY" });
    prisma.academicYear.upsert.mockResolvedValue({ id: "year_demo", code: "DEMO-AY-2026" });
    prisma.term.upsert.mockResolvedValue({ id: "term_demo", code: "DEMO-T1-2026" });
    prisma.classSection.upsert.mockResolvedValue({ id: "section_demo", code: "DEMO-G1-A" });
    prisma.courseClass.upsert.mockResolvedValue({ id: "course_demo", code: "DEMO-LIT-G1" });
    prisma.family.upsert.mockResolvedValue({ id: "family_demo", familyCode: "DEMO-FAM-001" });
    prisma.studentProfile.upsert.mockResolvedValue({ id: "student_demo", studentNumber: "DEMO-STU-001" });
    prisma.guardianProfile.findFirst.mockResolvedValue(null);
    prisma.guardianProfile.create.mockResolvedValue({ id: "guardian_demo", userId: "user_guardian" });
    prisma.studentPrimaryPlacement.findFirst.mockResolvedValue(null);
    prisma.studentPrimaryPlacement.create.mockResolvedValue({ id: "placement_demo" });
    prisma.studentCourseEnrollment.upsert.mockResolvedValue({ id: "enrollment_demo" });

    const result = await seedEducationDemo(prisma, {
      guardianEmail: "guardian.demo@example.edu",
      guardianPassword: "GuardianPass123!"
    });

    const userUpsert = prisma.user.upsert.mock.calls[0]?.[0];
    if (!userUpsert) {
      throw new Error("Expected guardian user upsert to be called");
    }
    expect(userUpsert.where).toEqual({ email: "guardian.demo@example.edu" });
    expect(userUpsert.create.status).toBe("active");
    expect(userUpsert.create.mustChangePassword).toBe(false);
    expect(userUpsert.update.status).toBe("active");
    expect(userUpsert.update.mustChangePassword).toBe(false);
    await expect(verifySeedEducationDemoPassword("GuardianPass123!", userUpsert.create.passwordHash)).resolves.toBe(true);

    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user_guardian", roleId: "role_guardian" }],
      skipDuplicates: true
    });
    const guardianCreate = prisma.guardianProfile.create.mock.calls[0]?.[0];
    if (!guardianCreate) {
      throw new Error("Expected guardian profile create to be called");
    }
    expect(guardianCreate.data).toMatchObject({
      userId: "user_guardian",
      email: "guardian.demo@example.edu"
    });

    const relationshipCreateMany = prisma.guardianStudentRelationship.createMany.mock.calls[0]?.[0];
    if (!relationshipCreateMany) {
      throw new Error("Expected guardian/student relationship createMany to be called");
    }
    expect(relationshipCreateMany).toMatchObject({ skipDuplicates: true });
    expect(relationshipCreateMany.data).toEqual([
      expect.objectContaining({
        guardianId: "guardian_demo",
        studentId: "student_demo",
        hasPortalAccess: true
      })
    ]);
    expect(result).toMatchObject({
      guardianLoginEmail: "guardian.demo@example.edu",
      guardianPassword: "GuardianPass123!",
      familyCode: "DEMO-FAM-001",
      studentNumber: "DEMO-STU-001"
    });
  });
});
