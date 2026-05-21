import { ConflictException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { FamilyPortalService } from "./family-portal.service.js";

function createPrismaMock() {
  const tx = {
    guardianProfile: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  };

  return {
    tx,
    db: {
      guardianProfile: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      },
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    }
  };
}

describe("FamilyPortalService", () => {
  it("returns only families and students linked to the authenticated guardian user", async () => {
    const prisma = createPrismaMock();
    prisma.db.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      firstName: "Amina",
      lastName: "Rahman",
      families: [{ family: { id: "family_1", displayName: "Rahman Family" } }],
      students: [
        {
          hasPortalAccess: true,
          relationshipType: "mother",
          student: {
            id: "student_1",
            firstName: "Nadia",
            lastName: "Rahman",
            primaryPlacements: []
          }
        }
      ]
    });

    const service = new FamilyPortalService(prisma as never);
    const portal = await service.getMyFamily("user_1");

    expect(portal).toMatchObject({
      guardian: { id: "guardian_1" },
      families: [{ id: "family_1" }],
      students: [{ id: "student_1", relationshipType: "mother" }]
    });
    expect(prisma.db.guardianProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1" }
      })
    );
  });

  it("rejects portal access when no guardian profile is linked to the user", async () => {
    const prisma = createPrismaMock();
    prisma.db.guardianProfile.findUnique.mockResolvedValue(null);

    const service = new FamilyPortalService(prisma as never);

    await expect(service.getMyFamily("user_1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("updates the authenticated guardian contact details and linked login email immediately", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      userId: "user_1",
      firstName: "Amina",
      lastName: "Rahman",
      email: "old@example.com",
      phone: "01700000000"
    });
    prisma.tx.user.findUnique.mockResolvedValue(null);
    prisma.tx.guardianProfile.update.mockResolvedValue({
      id: "guardian_1",
      firstName: "Sara",
      lastName: "Karim",
      email: "new@example.com",
      phone: "01800000000"
    });

    const service = new FamilyPortalService(prisma as never);

    const contact = await service.updateMyContact("user_1", {
      firstName: " Sara ",
      lastName: " Karim ",
      email: " New@Example.com ",
      phone: "01800000000"
    });

    expect(contact).toEqual({
      id: "guardian_1",
      firstName: "Sara",
      lastName: "Karim",
      email: "new@example.com",
      phone: "01800000000"
    });
    expect(prisma.tx.user.findUnique).toHaveBeenCalledWith({
      where: { email: "new@example.com" },
      select: { id: true }
    });
    expect(prisma.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: {
        email: "new@example.com",
        name: "Sara Karim"
      }
    });
    expect(prisma.tx.guardianProfile.update).toHaveBeenCalledWith({
      where: { id: "guardian_1" },
      data: {
        firstName: "Sara",
        lastName: "Karim",
        email: "new@example.com",
        phone: "01800000000"
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });
    expect(prisma.tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "user_1",
        event: "familyPortal.contact.updated",
        targetType: "guardianProfile",
        targetId: "guardian_1",
        metadata: {
          changedFields: ["firstName", "lastName", "email", "phone"]
        }
      }
    });
  });

  it("rejects guardian contact email changes that belong to another user", async () => {
    const prisma = createPrismaMock();
    prisma.tx.guardianProfile.findUnique.mockResolvedValue({
      id: "guardian_1",
      userId: "user_1",
      firstName: "Amina",
      lastName: "Rahman",
      email: "old@example.com",
      phone: null
    });
    prisma.tx.user.findUnique.mockResolvedValue({ id: "user_2" });

    const service = new FamilyPortalService(prisma as never);

    await expect(service.updateMyContact("user_1", { email: "taken@example.com" })).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(prisma.tx.guardianProfile.update).not.toHaveBeenCalled();
    expect(prisma.tx.user.update).not.toHaveBeenCalled();
  });
});
