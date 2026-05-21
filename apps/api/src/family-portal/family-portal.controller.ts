import { Body, Controller, Get, Inject, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { UpdateMyContactDto } from "./family-portal.dto.js";
import { type FamilyPortalGuardianContact, type FamilyPortalResponse, FamilyPortalService } from "./family-portal.service.js";

type RequestWithUser = { user?: AuthenticatedUser };

@ApiTags("family-portal")
@Controller("family-portal")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class FamilyPortalController {
  constructor(@Inject(FamilyPortalService) private readonly familyPortalService: FamilyPortalService) {}

  @Get("me")
  @RequirePermissions("familyPortal.read")
  async getMyFamily(@Req() request: RequestWithUser): Promise<FamilyPortalResponse> {
    return this.familyPortalService.getMyFamily(requireUserId(request));
  }

  @Patch("me/contact")
  @RequirePermissions("familyPortal.updateContact")
  async updateMyContact(
    @Req() request: RequestWithUser,
    @Body() body: UpdateMyContactDto
  ): Promise<FamilyPortalGuardianContact> {
    return this.familyPortalService.updateMyContact(requireUserId(request), body);
  }
}

function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }
  return request.user.id;
}
