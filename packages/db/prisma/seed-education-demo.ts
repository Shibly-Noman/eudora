import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

type SeedEnvironment = Record<string, string | undefined>;

export type SeedEducationDemoConfig = {
  guardianEmail: string;
  guardianPassword: string;
};

export type SeedEducationDemoResult = {
  campusCode: string;
  programCode: string;
  academicYearCode: string;
  classSectionCode: string;
  courseClassCode: string;
  familyCode: string;
  studentNumber: string;
  guardianLoginEmail: string;
  guardianPassword: string;
};

type UnknownRecord = Record<string, unknown>;
type IdRecord = { id: string };
type CodeRecord = IdRecord & { code: string };
type FamilyCodeRecord = IdRecord & { familyCode: string };
type StudentNumberRecord = IdRecord & { studentNumber: string };
type GuardianRecord = IdRecord & { userId: string | null };
type GuardianUserRecord = IdRecord & { email: string };

type UserUpsertInput = {
  where: { email: string };
  update: {
    name: string;
    passwordHash: string;
    status: "active";
    emailVerifiedAt: Date;
    activatedAt: Date;
    mustChangePassword: false;
  };
  create: {
    email: string;
    name: string;
    passwordHash: string;
    status: "active";
    emailVerifiedAt: Date;
    activatedAt: Date;
    mustChangePassword: false;
  };
  select: { id: true; email: true };
};

type UpsertInput = {
  where: UnknownRecord;
  update: UnknownRecord;
  create: UnknownRecord;
  select: UnknownRecord;
};

type CreateManyInput = {
  data: UnknownRecord[];
  skipDuplicates: true;
};

export type SeedEducationDemoPrisma = {
  role: {
    findUnique: (input: { where: { key: "guardian" }; select: { id: true } }) => Promise<IdRecord | null>;
  };
  user: {
    upsert: (input: UserUpsertInput) => Promise<GuardianUserRecord>;
  };
  userRole: {
    createMany: (input: CreateManyInput) => Promise<unknown>;
  };
  campus: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  program: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  academicYear: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  term: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  classSection: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  courseClass: {
    upsert: (input: UpsertInput) => Promise<CodeRecord>;
  };
  family: {
    upsert: (input: UpsertInput) => Promise<FamilyCodeRecord>;
  };
  studentProfile: {
    upsert: (input: UpsertInput) => Promise<StudentNumberRecord>;
  };
  guardianProfile: {
    findFirst: (input: UnknownRecord) => Promise<GuardianRecord | null>;
    update: (input: UnknownRecord) => Promise<GuardianRecord>;
    create: (input: UnknownRecord) => Promise<GuardianRecord>;
  };
  familyGuardian: {
    createMany: (input: CreateManyInput) => Promise<unknown>;
  };
  familyStudent: {
    createMany: (input: CreateManyInput) => Promise<unknown>;
  };
  guardianStudentRelationship: {
    createMany: (input: CreateManyInput) => Promise<unknown>;
  };
  studentPrimaryPlacement: {
    findFirst: (input: UnknownRecord) => Promise<IdRecord | null>;
    update: (input: UnknownRecord) => Promise<IdRecord>;
    create: (input: UnknownRecord) => Promise<IdRecord>;
  };
  studentCourseEnrollment: {
    upsert: (input: UpsertInput) => Promise<IdRecord>;
  };
  auditLog: {
    create: (input: UnknownRecord) => Promise<unknown>;
  };
};

const demo = {
  campus: {
    code: "DEMO-MAIN",
    name: "Demo Main Campus",
    phone: "+1-555-0100",
    email: "campus.demo@example.edu"
  },
  program: {
    code: "DEMO-PRIMARY",
    name: "Demo Primary Program",
    description: "Demo primary education program."
  },
  academicYear: {
    code: "DEMO-AY-2026",
    name: "Demo Academic Year 2026-2027",
    startsOn: new Date("2026-08-01T00:00:00.000Z"),
    endsOn: new Date("2027-06-30T00:00:00.000Z")
  },
  term: {
    code: "DEMO-T1-2026",
    name: "Demo Term 1",
    startsOn: new Date("2026-08-01T00:00:00.000Z"),
    endsOn: new Date("2026-12-15T00:00:00.000Z")
  },
  classSection: {
    code: "DEMO-G1-A",
    name: "Demo Grade 1 A",
    capacity: 24
  },
  courseClass: {
    code: "DEMO-LIT-G1",
    name: "Demo Literacy Lab",
    capacity: 24
  },
  family: {
    familyCode: "DEMO-FAM-001",
    displayName: "Ahmed Demo Family",
    primaryPhone: "+1-555-0198"
  },
  guardian: {
    firstName: "Nadia",
    lastName: "Ahmed",
    phone: "+1-555-0198"
  },
  student: {
    studentNumber: "DEMO-STU-001",
    firstName: "Mina",
    lastName: "Ahmed",
    dateOfBirth: new Date("2019-04-15T00:00:00.000Z"),
    gender: "female"
  }
};

export function resolveSeedEducationDemoConfig(
  env: SeedEnvironment = process.env
): SeedEducationDemoConfig | null {
  if (env.SEED_EDUCATION_DEMO !== "true") {
    return null;
  }

  const guardianEmail = normalizeEmail(env.SEED_DEMO_GUARDIAN_EMAIL ?? "guardian.demo@example.edu");
  const guardianPassword = env.SEED_DEMO_GUARDIAN_PASSWORD ?? "GuardianPass123!";

  if (!guardianEmail) {
    throw new Error("SEED_DEMO_GUARDIAN_EMAIL must not be empty when SEED_EDUCATION_DEMO=true");
  }
  if (!guardianPassword) {
    throw new Error("SEED_DEMO_GUARDIAN_PASSWORD must not be empty when SEED_EDUCATION_DEMO=true");
  }

  return {
    guardianEmail,
    guardianPassword
  };
}

export async function seedEducationDemo(
  prisma: SeedEducationDemoPrisma,
  config = resolveSeedEducationDemoConfig()
): Promise<SeedEducationDemoResult | null> {
  if (!config) {
    return null;
  }

  const guardianRole = await prisma.role.findUnique({
    where: { key: "guardian" },
    select: { id: true }
  });

  if (!guardianRole) {
    throw new Error("Cannot seed education demo before the guardian role exists");
  }

  const passwordHash = await hashPassword(config.guardianPassword);
  const now = new Date();
  const guardianUser = await prisma.user.upsert({
    where: { email: config.guardianEmail },
    update: {
      name: `${demo.guardian.firstName} ${demo.guardian.lastName}`,
      passwordHash,
      status: "active",
      emailVerifiedAt: now,
      activatedAt: now,
      mustChangePassword: false
    },
    create: {
      email: config.guardianEmail,
      name: `${demo.guardian.firstName} ${demo.guardian.lastName}`,
      passwordHash,
      status: "active",
      emailVerifiedAt: now,
      activatedAt: now,
      mustChangePassword: false
    },
    select: { id: true, email: true }
  });

  await prisma.userRole.createMany({
    data: [{ userId: guardianUser.id, roleId: guardianRole.id }],
    skipDuplicates: true
  });

  const campus = await prisma.campus.upsert({
    where: { code: demo.campus.code },
    update: {
      name: demo.campus.name,
      phone: demo.campus.phone,
      email: demo.campus.email,
      status: "active"
    },
    create: {
      code: demo.campus.code,
      name: demo.campus.name,
      phone: demo.campus.phone,
      email: demo.campus.email
    },
    select: { id: true, code: true }
  });
  const program = await prisma.program.upsert({
    where: { campusId_code: { campusId: campus.id, code: demo.program.code } },
    update: {
      name: demo.program.name,
      description: demo.program.description,
      status: "active"
    },
    create: {
      campusId: campus.id,
      code: demo.program.code,
      name: demo.program.name,
      description: demo.program.description
    },
    select: { id: true, code: true }
  });
  const academicYear = await prisma.academicYear.upsert({
    where: { code: demo.academicYear.code },
    update: {
      name: demo.academicYear.name,
      startsOn: demo.academicYear.startsOn,
      endsOn: demo.academicYear.endsOn,
      isActive: true
    },
    create: {
      code: demo.academicYear.code,
      name: demo.academicYear.name,
      startsOn: demo.academicYear.startsOn,
      endsOn: demo.academicYear.endsOn,
      isActive: true
    },
    select: { id: true, code: true }
  });
  const term = await prisma.term.upsert({
    where: { academicYearId_code: { academicYearId: academicYear.id, code: demo.term.code } },
    update: {
      name: demo.term.name,
      startsOn: demo.term.startsOn,
      endsOn: demo.term.endsOn
    },
    create: {
      academicYearId: academicYear.id,
      code: demo.term.code,
      name: demo.term.name,
      startsOn: demo.term.startsOn,
      endsOn: demo.term.endsOn
    },
    select: { id: true, code: true }
  });
  const classSection = await prisma.classSection.upsert({
    where: {
      campusId_academicYearId_code: {
        campusId: campus.id,
        academicYearId: academicYear.id,
        code: demo.classSection.code
      }
    },
    update: {
      programId: program.id,
      termId: term.id,
      name: demo.classSection.name,
      capacity: demo.classSection.capacity,
      status: "active"
    },
    create: {
      campusId: campus.id,
      programId: program.id,
      academicYearId: academicYear.id,
      termId: term.id,
      code: demo.classSection.code,
      name: demo.classSection.name,
      capacity: demo.classSection.capacity
    },
    select: { id: true, code: true }
  });
  const courseClass = await prisma.courseClass.upsert({
    where: {
      campusId_academicYearId_code: {
        campusId: campus.id,
        academicYearId: academicYear.id,
        code: demo.courseClass.code
      }
    },
    update: {
      programId: program.id,
      termId: term.id,
      name: demo.courseClass.name,
      capacity: demo.courseClass.capacity,
      status: "active"
    },
    create: {
      campusId: campus.id,
      programId: program.id,
      academicYearId: academicYear.id,
      termId: term.id,
      code: demo.courseClass.code,
      name: demo.courseClass.name,
      capacity: demo.courseClass.capacity
    },
    select: { id: true, code: true }
  });
  const family = await prisma.family.upsert({
    where: { familyCode: demo.family.familyCode },
    update: {
      displayName: demo.family.displayName,
      primaryEmail: config.guardianEmail,
      primaryPhone: demo.family.primaryPhone,
      status: "active"
    },
    create: {
      familyCode: demo.family.familyCode,
      displayName: demo.family.displayName,
      primaryEmail: config.guardianEmail,
      primaryPhone: demo.family.primaryPhone
    },
    select: { id: true, familyCode: true }
  });
  const student = await prisma.studentProfile.upsert({
    where: { studentNumber: demo.student.studentNumber },
    update: {
      firstName: demo.student.firstName,
      lastName: demo.student.lastName,
      dateOfBirth: demo.student.dateOfBirth,
      gender: demo.student.gender,
      status: "active"
    },
    create: {
      studentNumber: demo.student.studentNumber,
      firstName: demo.student.firstName,
      lastName: demo.student.lastName,
      dateOfBirth: demo.student.dateOfBirth,
      gender: demo.student.gender
    },
    select: { id: true, studentNumber: true }
  });

  const guardian = await upsertDemoGuardianProfile(prisma, guardianUser.id, config.guardianEmail);

  await prisma.familyGuardian.createMany({
    data: [{ familyId: family.id, guardianId: guardian.id, isPrimary: true }],
    skipDuplicates: true
  });
  await prisma.familyStudent.createMany({
    data: [{ familyId: family.id, studentId: student.id, isPrimaryHousehold: true, livesWithFamily: true }],
    skipDuplicates: true
  });
  await prisma.guardianStudentRelationship.createMany({
    data: [
      {
        guardianId: guardian.id,
        studentId: student.id,
        relationshipType: "mother",
        isPrimaryContact: true,
        isEmergencyContact: true,
        isPickupAuthorized: true,
        isBillingResponsible: true,
        hasPortalAccess: true,
        canApproveRequests: true
      }
    ],
    skipDuplicates: true
  });

  await upsertActivePrimaryPlacement(prisma, student.id, classSection.id, academicYear.id);
  await prisma.studentCourseEnrollment.upsert({
    where: { studentId_courseClassId: { studentId: student.id, courseClassId: courseClass.id } },
    update: {
      enrolledOn: demo.academicYear.startsOn,
      endedOn: null,
      status: "active"
    },
    create: {
      studentId: student.id,
      courseClassId: courseClass.id,
      enrolledOn: demo.academicYear.startsOn,
      status: "active"
    },
    select: { id: true }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: guardianUser.id,
      event: "seed.educationDemo.ensured",
      targetType: "family",
      targetId: family.id,
      metadata: {
        guardianId: guardian.id,
        studentId: student.id,
        guardianEmail: guardianUser.email
      }
    }
  });

  return {
    campusCode: campus.code,
    programCode: program.code,
    academicYearCode: academicYear.code,
    classSectionCode: classSection.code,
    courseClassCode: courseClass.code,
    familyCode: family.familyCode,
    studentNumber: student.studentNumber,
    guardianLoginEmail: guardianUser.email,
    guardianPassword: config.guardianPassword
  };
}

async function upsertDemoGuardianProfile(
  prisma: Pick<SeedEducationDemoPrisma, "guardianProfile">,
  userId: string,
  email: string
): Promise<{ id: string; userId: string | null }> {
  const existingGuardian = await prisma.guardianProfile.findFirst({
    where: {
      OR: [{ userId }, { email }]
    },
    select: { id: true, userId: true }
  });

  if (existingGuardian) {
    return prisma.guardianProfile.update({
      where: { id: existingGuardian.id },
      data: {
        userId,
        firstName: demo.guardian.firstName,
        lastName: demo.guardian.lastName,
        email,
        phone: demo.guardian.phone,
        status: "active"
      },
      select: { id: true, userId: true }
    });
  }

  return prisma.guardianProfile.create({
    data: {
      userId,
      firstName: demo.guardian.firstName,
      lastName: demo.guardian.lastName,
      email,
      phone: demo.guardian.phone
    },
    select: { id: true, userId: true }
  });
}

async function upsertActivePrimaryPlacement(
  prisma: Pick<SeedEducationDemoPrisma, "studentPrimaryPlacement">,
  studentId: string,
  classSectionId: string,
  academicYearId: string
): Promise<void> {
  const existingPlacement = await prisma.studentPrimaryPlacement.findFirst({
    where: {
      studentId,
      academicYearId,
      status: "active"
    },
    select: { id: true }
  });

  if (existingPlacement) {
    await prisma.studentPrimaryPlacement.update({
      where: { id: existingPlacement.id },
      data: {
        classSectionId,
        startsOn: demo.academicYear.startsOn,
        endsOn: null,
        status: "active"
      },
      select: { id: true }
    });
    return;
  }

  await prisma.studentPrimaryPlacement.create({
    data: {
      studentId,
      classSectionId,
      academicYearId,
      startsOn: demo.academicYear.startsOn,
      status: "active"
    },
    select: { id: true }
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifySeedEducationDemoPassword(password: string, passwordHash: string): Promise<boolean> {
  const [scheme, salt, hash] = passwordHash.split("$");

  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
