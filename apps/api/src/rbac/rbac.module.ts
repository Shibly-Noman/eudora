import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { JwtService } from "../auth/jwt.service.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { PermissionsGuard } from "./permissions.guard.js";
import { RbacController } from "./rbac.controller.js";
import { RbacService } from "./rbac.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [CsrfGuard, JwtAuthGuard, JwtService, PermissionsGuard, RbacService, Reflector],
  exports: [PermissionsGuard, RbacService]
})
export class RbacModule {}
