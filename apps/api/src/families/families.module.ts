import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { FamiliesController } from "./families.controller.js";
import { FamiliesService } from "./families.service.js";
import { GuardianAccountsService } from "./guardian-accounts.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [FamiliesController],
  providers: [FamiliesService, GuardianAccountsService],
  exports: [FamiliesService, GuardianAccountsService]
})
export class FamiliesModule {}
