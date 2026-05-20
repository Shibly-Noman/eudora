import "dotenv/config";
import "reflect-metadata";

import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RbacModule } from "./rbac/rbac.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [PrismaModule, RbacModule, AuthModule, UsersModule, HealthModule]
})
export class AppModule {}
