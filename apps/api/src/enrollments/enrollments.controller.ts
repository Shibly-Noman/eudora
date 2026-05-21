import { Body, Controller, Inject, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { CreateCourseEnrollmentDto, ReplacePrimaryPlacementDto } from "./enrollments.dto.js";
import { type CourseEnrollmentRecord, EnrollmentsService, type PrimaryPlacementRecord } from "./enrollments.service.js";

type RequestWithUser = { user?: AuthenticatedUser };

@ApiTags("enrollments")
@Controller("students/:studentId")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class EnrollmentsController {
  constructor(@Inject(EnrollmentsService) private readonly enrollmentsService: EnrollmentsService) {}

  @Put("primary-placement")
  @RequirePermissions("enrollments.manage")
  async replacePrimaryPlacement(
    @Param("studentId") studentId: string,
    @Body() body: ReplacePrimaryPlacementDto,
    @Req() request: RequestWithUser
  ): Promise<PrimaryPlacementRecord> {
    return this.enrollmentsService.replacePrimaryPlacement(studentId, body, requireUserId(request));
  }

  @Post("course-enrollments")
  @RequirePermissions("enrollments.manage")
  async createCourseEnrollment(
    @Param("studentId") studentId: string,
    @Body() body: CreateCourseEnrollmentDto,
    @Req() request: RequestWithUser
  ): Promise<CourseEnrollmentRecord> {
    return this.enrollmentsService.createCourseEnrollment(studentId, body, requireUserId(request));
  }
}

function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }
  return request.user.id;
}
