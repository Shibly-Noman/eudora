/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, it, vi } from "vitest";

import { FamiliesService } from "./families.service.js";

function createPrismaMock() {
  const tx = {
    family: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    guardianProfile: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    studentProfile: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    familyGuardian: {
      create: vi.fn()
    },
    familyStudent: {
      create: vi.fn()
    },
    guardianStudentRelationship: {
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn()
    },
    classSection: {
      findUnique: vi.fn()
    },
    studentPrimaryPlacement: {
      findFirst: vi.fn(),
      create: vi.fn()
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  };

  return {
    tx,
    db: {
      ...tx,
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    }
  };
}

describe("FamiliesService", () => {
  it("creates a family, guardian, student, relationship, and placement in one wizard transaction", async () => {
    const prisma = createPrismaMock();
    prisma.tx.family.create.mockResolvedValue({ id: "family_1", familyCode: "FAM-001", displayName: "Rahman Family" });
    prisma.tx.guardianProfile.create.mockResolvedValue({ id: "guardian_1", firstName: "Amina", lastName: "Rahman" });
    prisma.tx.studentProfile.create.mockResolvedValue({ id: "student_1", studentNumber: "STU-001", firstName: "Nadia", lastName: "Rahman" });
    prisma.tx.classSection.findUnique.mockResolvedValue({
      id: "section_1",
      academicYearId: "year_1",
      campusId: "campus_1",
      programId: "program_1"
    });
    prisma.tx.studentPrimaryPlacement.findFirst.mockResolvedValue(null);
    prisma.tx.studentPrimaryPlacement.create.mockResolvedValue({ id: "placement_1" });

    const service = new FamiliesService(prisma as never);
    const result = await service.createFamilyWizard(
      {
        family: { familyCode: "fam-001", displayName: "Rahman Family" },
        guardian: { firstName: "Amina", lastName: "Rahman", email: "amina@example.com" },
        student: { studentNumber: "stu-001", firstName: "Nadia", lastName: "Rahman" },
        relationship: {
          relationshipType: "mother",
          isPrimaryContact: true,
          isEmergencyContact: true,
          isPickupAuthorized: true,
          isBillingResponsible: true,
          hasPortalAccess: true,
          canApproveRequests: true
        },
        primaryPlacement: {
          classSectionId: "section_1",
          academicYearId: "year_1",
          startsOn: "2026-08-01"
        }
      },
      "admin_1"
    );

    expect(result).toMatchObject({
      family: { id: "family_1" },
      guardian: { id: "guardian_1" },
      student: { id: "student_1" },
      primaryPlacement: { id: "placement_1" }
    });
    expect(prisma.db.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.tx.family.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ familyCode: "FAM-001", displayName: "Rahman Family" }),
      select: expect.any(Object)
    });
    expect(prisma.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "families.wizard.created",
        targetType: "family",
        targetId: "family_1"
      })
    });
  });

  it("returns family detail with portal readiness and activity", async () => {
    const prisma = createPrismaMock();
    prisma.db.family.findUnique.mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: "family@example.com",
      primaryPhone: "+880100000000",
      status: "active",
      guardians: [
        {
          isPrimary: true,
          guardian: {
            id: "guardian_1",
            userId: "user_1",
            firstName: "Amina",
            lastName: "Rahman",
            email: "amina@example.com",
            phone: "+880100000001",
            status: "active",
            user: { id: "user_1", email: "amina@example.com", status: "active", mustChangePassword: true }
          }
        }
      ],
      students: [
        {
          isPrimaryHousehold: true,
          livesWithFamily: true,
          student: {
            id: "student_1",
            studentNumber: "STU-001",
            firstName: "Nadia",
            lastName: "Rahman",
            status: "active",
            guardians: [
              {
                id: "relationship_1",
                guardianId: "guardian_1",
                studentId: "student_1",
                relationshipType: "mother",
                isPrimaryContact: true,
                isEmergencyContact: true,
                isPickupAuthorized: true,
                isBillingResponsible: false,
                hasPortalAccess: true,
                canApproveRequests: true,
                guardian: {
                  id: "guardian_1",
                  firstName: "Amina",
                  lastName: "Rahman",
                  email: "amina@example.com",
                  userId: "user_1"
                }
              }
            ],
            primaryPlacements: [],
            courseEnrollments: []
          }
        }
      ]
    });
    prisma.db.auditLog.findMany.mockResolvedValue([
      {
        id: "audit_1",
        event: "families.wizard.created",
        targetType: "family",
        targetId: "family_1",
        createdAt: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    const service = new FamiliesService(prisma as never);
    const result = await service.getFamilyDetail("family_1");

    expect(result).toMatchObject({
      id: "family_1",
      guardians: [
        {
          id: "guardian_1",
          portalStatus: "linked_portal_active",
          relationships: [{ id: "relationship_1", studentId: "student_1", hasPortalAccess: true }]
        }
      ],
      students: [{ id: "student_1", guardians: [{ guardianId: "guardian_1" }] }],
      activity: [{ id: "audit_1", event: "families.wizard.created" }]
    });
  });

  it("updates guardian-student responsibility flags and records an audit event", async () => {
    const prisma = createPrismaMock();
    prisma.db.guardianStudentRelationship.update.mockResolvedValue({
      id: "relationship_1",
      guardianId: "guardian_1",
      studentId: "student_1",
      relationshipType: "mother",
      isPrimaryContact: true,
      isEmergencyContact: true,
      isPickupAuthorized: false,
      isBillingResponsible: true,
      hasPortalAccess: true,
      canApproveRequests: false
    });

    const service = new FamiliesService(prisma as never);
    const result = await service.updateGuardianStudentRelationship(
      "relationship_1",
      { isBillingResponsible: true, hasPortalAccess: true },
      "admin_1"
    );

    expect(result).toMatchObject({
      id: "relationship_1",
      isBillingResponsible: true,
      hasPortalAccess: true
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "families.relationship.updated",
        targetType: "guardianStudentRelationship",
        targetId: "relationship_1"
      })
    });
  });

  it("updates household contact, address, and status fields", async () => {
    const prisma = createPrismaMock();
    prisma.db.family.update.mockResolvedValue({
      id: "family_1",
      familyCode: "FAM-001",
      displayName: "Rahman Household",
      primaryEmail: "family@example.com",
      primaryPhone: "+880100000000",
      addressLine1: "House 12",
      addressLine2: "Road 4",
      city: "Dhaka",
      state: "Dhaka",
      postalCode: "1207",
      country: "Bangladesh",
      status: "active",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z")
    });

    const service = new FamiliesService(prisma as never);
    const result = await service.updateFamily(
      "family_1",
      {
        displayName: " Rahman Household ",
        primaryEmail: "family@example.com",
        primaryPhone: "+880100000000",
        addressLine1: "House 12",
        addressLine2: "Road 4",
        city: "Dhaka",
        state: "Dhaka",
        postalCode: "1207",
        country: "Bangladesh",
        status: "active"
      },
      "admin_1"
    );

    expect(result).toMatchObject({
      id: "family_1",
      addressLine1: "House 12",
      city: "Dhaka",
      status: "active"
    });
    expect(prisma.db.family.update).toHaveBeenCalledWith({
      where: { id: "family_1" },
      data: expect.objectContaining({
        displayName: "Rahman Household",
        addressLine1: "House 12",
        city: "Dhaka",
        status: "active"
      }),
      select: expect.any(Object)
    });
  });

  it("adds a guardian to a family and links that guardian to selected students", async () => {
    const prisma = createPrismaMock();
    prisma.db.guardianProfile.create.mockResolvedValue({
      id: "guardian_2",
      firstName: "Karim",
      lastName: "Rahman",
      email: "karim@example.com",
      phone: null
    });

    const service = new FamiliesService(prisma as never);
    const result = await service.addGuardianToFamily(
      "family_1",
      {
        firstName: "Karim",
        lastName: "Rahman",
        email: "karim@example.com",
        studentRelationships: [
          {
            studentId: "student_1",
            relationshipType: "father",
            isPrimaryContact: true,
            hasPortalAccess: true
          }
        ]
      },
      "admin_1"
    );

    expect(result).toMatchObject({ id: "guardian_2" });
    expect(prisma.db.guardianStudentRelationship.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          guardianId: "guardian_2",
          studentId: "student_1",
          relationshipType: "father",
          isPrimaryContact: true,
          hasPortalAccess: true
        })
      ],
      skipDuplicates: true
    });
  });

  it("adds a student to a family and links that student to selected guardians", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentProfile.create.mockResolvedValue({
      id: "student_2",
      studentNumber: "STU-002",
      firstName: "Rafi",
      lastName: "Rahman"
    });

    const service = new FamiliesService(prisma as never);
    const result = await service.addStudentToFamily(
      "family_1",
      {
        studentNumber: "stu-002",
        firstName: "Rafi",
        lastName: "Rahman",
        guardianRelationships: [
          {
            guardianId: "guardian_1",
            relationshipType: "mother",
            isEmergencyContact: true,
            hasPortalAccess: true
          }
        ]
      },
      "admin_1"
    );

    expect(result).toMatchObject({ id: "student_2", studentNumber: "STU-002" });
    expect(prisma.db.guardianStudentRelationship.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          guardianId: "guardian_1",
          studentId: "student_2",
          relationshipType: "mother",
          isEmergencyContact: true,
          hasPortalAccess: true
        })
      ],
      skipDuplicates: true
    });
  });

  it("returns student detail with families, guardians, placement, and course enrollments", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentProfile.findUnique.mockResolvedValue({
      id: "student_1",
      studentNumber: "STU-001",
      firstName: "Nadia",
      lastName: "Rahman",
      dateOfBirth: null,
      gender: null,
      status: "active",
      families: [
        {
          isPrimaryHousehold: true,
          livesWithFamily: true,
          family: { id: "family_1", familyCode: "FAM-001", displayName: "Rahman Household" }
        }
      ],
      guardians: [
        {
          id: "relationship_1",
          relationshipType: "mother",
          hasPortalAccess: true,
          guardian: { id: "guardian_1", firstName: "Amina", lastName: "Rahman", email: "amina@example.com", userId: "user_1" }
        }
      ],
      primaryPlacements: [
        {
          id: "placement_1",
          status: "active",
          startsOn: new Date("2026-08-01T00:00:00.000Z"),
          endsOn: null,
          classSection: {
            id: "section_1",
            code: "G1-A",
            name: "Grade 1 A",
            campus: { id: "campus_1", code: "MAIN", name: "Main Campus" },
            program: { id: "program_1", code: "PRIMARY", name: "Primary School" },
            academicYear: { id: "year_1", code: "AY2026", name: "Academic Year 2026" }
          }
        }
      ],
      courseEnrollments: []
    });

    const service = new FamiliesService(prisma as never);
    const result = await service.getStudentDetail("student_1");

    expect(result).toMatchObject({
      id: "student_1",
      families: [{ id: "family_1", isPrimaryHousehold: true }],
      guardians: [{ id: "relationship_1", guardian: { id: "guardian_1" } }],
      primaryPlacements: [{ id: "placement_1", classSection: { id: "section_1" } }]
    });
  });
});
