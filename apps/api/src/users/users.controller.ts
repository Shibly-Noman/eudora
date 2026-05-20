import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { CreateManagedUserDto, ReplaceUserRolesDto } from "./users.dto.js";
import { type UserRoleSummary, type UserSummary, UsersService } from "./users.service.js";

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions("users.read")
  async listUsers(@Query("status") status?: string): Promise<UserSummary[]> {
    return this.usersService.listUsers(status);
  }

  @Post()
  @RequirePermissions("users.create")
  async createManagedUser(@Body() body: CreateManagedUserDto, @Req() request: RequestWithUser): Promise<UserSummary> {
    return this.usersService.createManagedUser(body, requireUserId(request));
  }

  @Patch(":id/activate")
  @RequirePermissions("users.activate")
  async activateUser(@Param("id") id: string, @Req() request: RequestWithUser): Promise<UserSummary> {
    return this.usersService.activateUser(id, requireUserId(request));
  }

  @Patch(":id/reject")
  @RequirePermissions("users.reject")
  async rejectUser(@Param("id") id: string, @Req() request: RequestWithUser): Promise<UserSummary> {
    return this.usersService.rejectUser(id, requireUserId(request));
  }

  @Get(":id/roles")
  @RequirePermissions("users.read")
  async listUserRoles(@Param("id") id: string): Promise<UserRoleSummary[]> {
    return this.usersService.listUserRoles(id);
  }

  @Put(":id/roles")
  @RequirePermissions("users.assignRoles")
  async replaceUserRoles(
    @Param("id") id: string,
    @Body() body: ReplaceUserRolesDto,
    @Req() request: RequestWithUser
  ): Promise<UserRoleSummary[]> {
    return this.usersService.replaceUserRoles(id, body.roleKeys, requireUserId(request));
  }
}

function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }

  return request.user.id;
}
