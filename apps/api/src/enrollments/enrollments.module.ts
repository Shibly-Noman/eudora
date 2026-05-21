import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { EnrollmentsController } from "./enrollments.controller.js";
import { EnrollmentsService } from "./enrollments.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService]
})
export class EnrollmentsModule {}
