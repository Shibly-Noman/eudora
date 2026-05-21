import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { FamilyPortalController } from "./family-portal.controller.js";
import { FamilyPortalService } from "./family-portal.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [FamilyPortalController],
  providers: [FamilyPortalService]
})
export class FamilyPortalModule {}
