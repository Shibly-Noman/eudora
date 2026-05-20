import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { CsrfGuard } from "./csrf.guard.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";

@Module({
  imports: [PrismaModule, RbacModule],
  controllers: [AuthController],
  providers: [AuthService, CsrfGuard, JwtAuthGuard, JwtService, PasswordService],
  exports: [AuthService, CsrfGuard, JwtAuthGuard, JwtService, PasswordService]
})
export class AuthModule {}
