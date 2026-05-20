import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

type SeedEnvironment = Record<string, string | undefined>;

export type SeedSuperadminConfig = {
  email: string;
  password: string;
  name: string;
  resetPassword: boolean;
};

type SeedPrisma = {
  user: {
    create: (input: {
      data: {
        email: string;
        passwordHash: string;
        name: string;
        status: "active";
        emailVerifiedAt: Date;
        activatedAt: Date;
        mustChangePassword: false;
      };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string }>;
    findUnique: (input: {
      where: { email: string };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string } | null>;
    update: (input: {
      where: { id: string };
      data: {
        name: string;
        status: "active";
        emailVerifiedAt: Date;
        activatedAt: Date;
        mustChangePassword: false;
        passwordHash?: string;
      };
      select: { id: true; email: true };
    }) => Promise<{ id: string; email: string }>;
  };
  role: {
    findUnique: (input: {
      where: { key: "superadmin" };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
  userRole: {
    createMany: (input: {
      data: { userId: string; roleId: string; assignedById: string }[];
      skipDuplicates: true;
    }) => Promise<unknown>;
  };
  auditLog: {
    create: (input: {
      data: {
        actorUserId: string;
        event: string;
        targetType: "user";
        targetId: string;
        metadata: { email: string };
      };
    }) => Promise<unknown>;
  };
};

export function resolveSeedSuperadminConfig(
  env: SeedEnvironment = process.env
): SeedSuperadminConfig | null {
  if (env.SEED_SUPERADMIN_ENABLED === "false") {
    return null;
  }

  const isProduction = env.NODE_ENV === "production";
  const email = env.SEED_SUPERADMIN_EMAIL ?? (isProduction ? undefined : "admin@example.com");
  const password = env.SEED_SUPERADMIN_PASSWORD ?? (isProduction ? undefined : "AdminPass123!");

  if (!email || !password) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    password,
    name: env.SEED_SUPERADMIN_NAME ?? "Super Admin",
    resetPassword: env.SEED_SUPERADMIN_RESET_PASSWORD === "true"
  };
}

export async function seedSuperadmin(
  prisma: SeedPrisma,
  config = resolveSeedSuperadminConfig()
): Promise<void> {
  if (!config) {
    return;
  }

  const superadminRole = await prisma.role.findUnique({
    where: { key: "superadmin" },
    select: { id: true }
  });

  if (!superadminRole) {
    throw new Error("Cannot seed superadmin user before the superadmin role exists");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: config.email },
    select: { id: true, email: true }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: config.name,
          status: "active",
          emailVerifiedAt: new Date(),
          activatedAt: new Date(),
          mustChangePassword: false,
          ...(config.resetPassword ? { passwordHash: await hashPassword(config.password) } : {})
        },
        select: { id: true, email: true }
      })
    : await prisma.user.create({
        data: {
          email: config.email,
          name: config.name,
          passwordHash: await hashPassword(config.password),
          status: "active",
          emailVerifiedAt: new Date(),
          activatedAt: new Date(),
          mustChangePassword: false
        },
        select: { id: true, email: true }
      });

  await prisma.userRole.createMany({
    data: [
      {
        userId: user.id,
        roleId: superadminRole.id,
        assignedById: user.id
      }
    ],
    skipDuplicates: true
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      event: existingUser ? "seed.superadmin.ensured" : "seed.superadmin.created",
      targetType: "user",
      targetId: user.id,
      metadata: {
        email: user.email
      }
    }
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifySeedPassword(password: string, passwordHash: string): Promise<boolean> {
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
