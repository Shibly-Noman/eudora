import { Body, Controller, ForbiddenException, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import {
  AddGuardianDto,
  AddStudentDto,
  CreateFamilyWizardDto,
  LinkGuardianUserDto,
  ListFamiliesQueryDto,
  UpdateFamilyDto,
  UpdateGuardianStudentRelationshipDto,
  UpdateStudentDto
} from "./families.dto.js";
import {
  FamiliesService,
  type FamilyDetail,
  type FamilyRecord,
  type FamilyWizardResult,
  type GuardianRecord,
  type GuardianRelationshipRecord,
  type Paginated,
  type StudentDetail,
  type StudentRecord
} from "./families.service.js";
import {
  type GuardianLoginResult,
  GuardianAccountsService,
  type GuardianUserLinkResult
} from "./guardian-accounts.service.js";

type RequestWithUser = { user?: AuthenticatedUser };

@ApiTags("families")
@Controller()
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class FamiliesController {
  constructor(
    @Inject(FamiliesService) private readonly familiesService: FamiliesService,
    @Inject(GuardianAccountsService) private readonly guardianAccountsService: GuardianAccountsService
  ) {}

  @Get("families")
  @RequirePermissions("families.read")
  async listFamilies(@Query() query: ListFamiliesQueryDto): Promise<Paginated<FamilyRecord>> {
    return this.familiesService.listFamilies(query);
  }

  @Get("families/:id")
  @RequirePermissions("families.read")
  async getFamilyDetail(@Param("id") id: string): Promise<FamilyDetail> {
    return this.familiesService.getFamilyDetail(id);
  }

  @Patch("families/:id")
  @RequirePermissions("families.update")
  async updateFamily(
    @Param("id") id: string,
    @Body() body: UpdateFamilyDto,
    @Req() request: RequestWithUser
  ): Promise<FamilyRecord> {
    return this.familiesService.updateFamily(id, body, requireUser(request).id);
  }

  @Post("families/:id/guardians")
  @RequirePermissions("families.update", "guardians.create")
  async addGuardianToFamily(
    @Param("id") id: string,
    @Body() body: AddGuardianDto,
    @Req() request: RequestWithUser
  ): Promise<GuardianRecord> {
    return this.familiesService.addGuardianToFamily(id, body, requireUser(request).id);
  }

  @Post("families/:id/students")
  @RequirePermissions("families.update", "students.create")
  async addStudentToFamily(
    @Param("id") id: string,
    @Body() body: AddStudentDto,
    @Req() request: RequestWithUser
  ): Promise<StudentRecord> {
    return this.familiesService.addStudentToFamily(id, body, requireUser(request).id);
  }

  @Post("families/wizard")
  @RequirePermissions("families.create", "guardians.create", "students.create")
  async createFamilyWizard(@Body() body: CreateFamilyWizardDto, @Req() request: RequestWithUser): Promise<FamilyWizardResult> {
    const user = requireUser(request);
    if (body.primaryPlacement && !user.permissions.includes("enrollments.manage")) {
      throw new ForbiddenException("Missing enrollments.manage permission for primary placement");
    }

    return this.familiesService.createFamilyWizard(body, user.id);
  }

  @Get("guardians")
  @RequirePermissions("guardians.read")
  async listGuardians(@Query() query: ListFamiliesQueryDto): Promise<Paginated<GuardianRecord>> {
    return this.familiesService.listGuardians(query);
  }

  @Post("guardians/:id/create-login")
  @RequirePermissions("guardians.update", "users.create")
  async createGuardianLogin(@Param("id") id: string, @Req() request: RequestWithUser): Promise<GuardianLoginResult> {
    return this.guardianAccountsService.createGuardianLogin(id, requireUser(request).id);
  }

  @Post("guardians/:id/link-user")
  @RequirePermissions("guardians.update", "users.assignRoles")
  async linkGuardianUser(
    @Param("id") id: string,
    @Body() body: LinkGuardianUserDto,
    @Req() request: RequestWithUser
  ): Promise<GuardianUserLinkResult> {
    return this.guardianAccountsService.linkExistingUser(id, body, requireUser(request).id);
  }

  @Get("students")
  @RequirePermissions("students.read")
  async listStudents(@Query() query: ListFamiliesQueryDto): Promise<Paginated<StudentRecord>> {
    return this.familiesService.listStudents(query);
  }

  @Get("students/:id")
  @RequirePermissions("students.read")
  async getStudentDetail(@Param("id") id: string): Promise<StudentDetail> {
    return this.familiesService.getStudentDetail(id);
  }

  @Patch("students/:id")
  @RequirePermissions("students.update")
  async updateStudent(
    @Param("id") id: string,
    @Body() body: UpdateStudentDto,
    @Req() request: RequestWithUser
  ): Promise<StudentRecord> {
    return this.familiesService.updateStudent(id, body, requireUser(request).id);
  }

  @Patch("guardian-student-relationships/:id")
  @RequirePermissions("families.update")
  async updateGuardianStudentRelationship(
    @Param("id") id: string,
    @Body() body: UpdateGuardianStudentRelationshipDto,
    @Req() request: RequestWithUser
  ): Promise<GuardianRelationshipRecord> {
    return this.familiesService.updateGuardianStudentRelationship(id, body, requireUser(request).id);
  }
}

function requireUser(request: RequestWithUser): AuthenticatedUser {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }
  return request.user;
}
