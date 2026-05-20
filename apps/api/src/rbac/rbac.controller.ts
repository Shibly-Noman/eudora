import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "./permissions.guard.js";
import { RbacService, type RoleSummary } from "./rbac.service.js";
import { CreateRoleDto, UpdateRoleDto } from "./rbac.dto.js";
import { RequirePermissions } from "./require-permissions.decorator.js";

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@ApiTags("rbac")
@Controller("rbac")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class RbacController {
  constructor(@Inject(RbacService) private readonly rbacService: RbacService) {}

  @Get("permissions")
  @RequirePermissions("roles.read")
  async listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get("roles")
  @RequirePermissions("roles.read")
  async listRoles(): Promise<RoleSummary[]> {
    return this.rbacService.listRoles();
  }

  @Post("roles")
  @RequirePermissions("roles.create")
  async createRole(@Body() body: CreateRoleDto, @Req() request: RequestWithUser): Promise<RoleSummary> {
    return this.rbacService.createRole(body, requireUserId(request));
  }

  @Patch("roles/:id")
  @RequirePermissions("roles.update")
  async updateRole(
    @Param("id") id: string,
    @Body() body: UpdateRoleDto,
    @Req() request: RequestWithUser
  ): Promise<RoleSummary> {
    return this.rbacService.updateRole(id, body, requireUserId(request));
  }
}

function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }

  return request.user.id;
}
