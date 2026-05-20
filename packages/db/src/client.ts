import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

type DatabaseEnvironment = Record<string, string | undefined>;

export function resolveDatabaseUrl(
  databaseUrl?: string,
  env: DatabaseEnvironment = process.env
): string {
  const resolvedUrl = databaseUrl ?? env.DATABASE_URL;

  if (!resolvedUrl) {
    throw new Error("DATABASE_URL is required to create a Prisma client");
  }

  return resolvedUrl;
}

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: resolveDatabaseUrl(databaseUrl)
  });

  return new PrismaClient({ adapter });
}

export { PrismaClient };
export type { Prisma } from "./generated/prisma/client.js";
