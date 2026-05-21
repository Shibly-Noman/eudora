import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { EducationStructureController } from "./education-structure.controller.js";
import { EducationStructureService } from "./education-structure.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [EducationStructureController],
  providers: [EducationStructureService],
  exports: [EducationStructureService]
})
export class EducationStructureModule {}
