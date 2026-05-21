/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, it, vi } from "vitest";

import { EducationStructureService } from "./education-structure.service.js";

function createPrismaMock() {
  return {
    db: {
      campus: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn()
      },
      classSection: {
        findUnique: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    }
  };
}

describe("EducationStructureService", () => {
  it("creates campuses with normalized codes and records an audit event", async () => {
    const prisma = createPrismaMock();
    prisma.db.campus.create.mockResolvedValue({
      id: "campus_1",
      code: "MAIN",
      name: "Main Campus",
      status: "active"
    });

    const service = new EducationStructureService(prisma as never);
    const campus = await service.createCampus({ code: " main ", name: "Main Campus" }, "admin_1");

    expect(campus).toMatchObject({ id: "campus_1", code: "MAIN", name: "Main Campus" });
    expect(prisma.db.campus.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ code: "MAIN", name: "Main Campus" }),
      select: expect.any(Object)
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "admin_1",
        event: "education.campus.created",
        targetType: "campus",
        targetId: "campus_1"
      })
    });
  });

  it("returns paginated campus lists with search", async () => {
    const prisma = createPrismaMock();
    prisma.db.campus.findMany.mockResolvedValue([{ id: "campus_1", code: "MAIN", name: "Main Campus" }]);
    prisma.db.campus.count.mockResolvedValue(1);

    const service = new EducationStructureService(prisma as never);
    const result = await service.listCampuses({ search: "main", page: 2, pageSize: 10 });

    expect(result).toEqual({
      items: [{ id: "campus_1", code: "MAIN", name: "Main Campus" }],
      total: 1,
      page: 2,
      pageSize: 10
    });
    expect(prisma.db.campus.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: {
          OR: [
            { code: { contains: "main", mode: "insensitive" } },
            { name: { contains: "main", mode: "insensitive" } }
          ]
        }
      })
    );
  });

  it("returns a class roster with active placements and guardian responsibility badges", async () => {
    const prisma = createPrismaMock();
    prisma.db.classSection.findUnique.mockResolvedValue({
      id: "section_1",
      code: "G1-A",
      name: "Grade 1 A",
      campus: { id: "campus_1", code: "MAIN", name: "Main Campus" },
      program: { id: "program_1", code: "PRIMARY", name: "Primary School" },
      academicYear: { id: "year_1", code: "AY2026", name: "Academic Year 2026" },
      primaryPlacements: [
        {
          id: "placement_1",
          startsOn: new Date("2026-08-01T00:00:00.000Z"),
          student: {
            id: "student_1",
            studentNumber: "STU-001",
            firstName: "Nadia",
            lastName: "Rahman",
            families: [
              {
                family: {
                  id: "family_1",
                  familyCode: "FAM-001",
                  displayName: "Rahman Household",
                  primaryEmail: "family@example.com",
                  primaryPhone: "+880100000000"
                }
              }
            ],
            guardians: [
              {
                id: "relationship_1",
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
                  phone: "+880100000001"
                }
              }
            ]
          }
        }
      ]
    });

    const service = new EducationStructureService(prisma as never);
    const result = await service.getClassSectionRoster("section_1");

    expect(result).toMatchObject({
      id: "section_1",
      students: [
        {
          id: "student_1",
          placementId: "placement_1",
          family: { id: "family_1" },
          guardians: [{ id: "guardian_1", relationshipType: "mother", isPrimaryContact: true }]
        }
      ]
    });
  });
});
