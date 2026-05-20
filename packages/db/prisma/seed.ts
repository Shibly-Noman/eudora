import { createPrismaClient } from "../src/client.js";
import { seedSuperadmin } from "./seed-superadmin.js";

const prisma = createPrismaClient();

const systemPermissions = [
  "users.read",
  "users.create",
  "users.activate",
  "users.reject",
  "users.assignRoles",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.assignPermissions",
  "audit.read"
];

const healthCheckCount = await prisma.healthCheck.count();

if (healthCheckCount === 0) {
  await prisma.healthCheck.create({
    data: {}
  });
}

const permissions = await Promise.all(
  systemPermissions.map((key) =>
    prisma.permission.upsert({
      where: { key },
      update: { isSystem: true },
      create: {
        key,
        isSystem: true
      }
    })
  )
);

const superadminRole = await prisma.role.upsert({
  where: { key: "superadmin" },
  update: {
    name: "Superadmin",
    isSystem: true
  },
  create: {
    key: "superadmin",
    name: "Superadmin",
    description: "Full platform administration access.",
    isSystem: true
  }
});

await prisma.rolePermission.createMany({
  data: permissions.map((permission) => ({
    roleId: superadminRole.id,
    permissionId: permission.id
  })),
  skipDuplicates: true
});

await seedSuperadmin(prisma);

await prisma.$disconnect();
