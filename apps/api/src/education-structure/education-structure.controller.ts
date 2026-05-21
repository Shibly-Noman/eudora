import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { type AuthenticatedUser } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import {
  CreateAcademicYearDto,
  CreateCampusDto,
  CreateClassSectionDto,
  CreateCourseClassDto,
  CreateProgramDto,
  CreateTermDto,
  ListQueryDto,
  UpdateAcademicYearDto,
  UpdateCampusDto,
  UpdateClassSectionDto,
  UpdateCourseClassDto,
  UpdateProgramDto,
  UpdateTermDto
} from "./education-structure.dto.js";
import {
  type AcademicYearRecord,
  type CampusRecord,
  type ClassSectionRoster,
  EducationStructureService,
  type Paginated,
  type ProgramRecord,
  type SectionRecord,
  type TermRecord
} from "./education-structure.service.js";

type RequestWithUser = { user?: AuthenticatedUser };

@ApiTags("education-structure")
@Controller()
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class EducationStructureController {
  constructor(@Inject(EducationStructureService) private readonly educationStructureService: EducationStructureService) {}

  @Get("campuses")
  @RequirePermissions("education.read")
  async listCampuses(@Query() query: ListQueryDto): Promise<Paginated<CampusRecord>> {
    return this.educationStructureService.listCampuses(query);
  }

  @Post("campuses")
  @RequirePermissions("education.manageStructure")
  async createCampus(@Body() body: CreateCampusDto, @Req() request: RequestWithUser): Promise<CampusRecord> {
    return this.educationStructureService.createCampus(body, requireUserId(request));
  }

  @Patch("campuses/:id")
  @RequirePermissions("education.manageStructure")
  async updateCampus(
    @Param("id") id: string,
    @Body() body: UpdateCampusDto,
    @Req() request: RequestWithUser
  ): Promise<CampusRecord> {
    return this.educationStructureService.updateCampus(id, body, requireUserId(request));
  }

  @Get("programs")
  @RequirePermissions("education.read")
  async listPrograms(@Query() query: ListQueryDto): Promise<Paginated<ProgramRecord>> {
    return this.educationStructureService.listPrograms(query);
  }

  @Post("programs")
  @RequirePermissions("education.manageStructure")
  async createProgram(@Body() body: CreateProgramDto, @Req() request: RequestWithUser): Promise<ProgramRecord> {
    return this.educationStructureService.createProgram(body, requireUserId(request));
  }

  @Patch("programs/:id")
  @RequirePermissions("education.manageStructure")
  async updateProgram(
    @Param("id") id: string,
    @Body() body: UpdateProgramDto,
    @Req() request: RequestWithUser
  ): Promise<ProgramRecord> {
    return this.educationStructureService.updateProgram(id, body, requireUserId(request));
  }

  @Get("academic-years")
  @RequirePermissions("education.read")
  async listAcademicYears(@Query() query: ListQueryDto): Promise<Paginated<AcademicYearRecord>> {
    return this.educationStructureService.listAcademicYears(query);
  }

  @Post("academic-years")
  @RequirePermissions("education.manageStructure")
  async createAcademicYear(
    @Body() body: CreateAcademicYearDto,
    @Req() request: RequestWithUser
  ): Promise<AcademicYearRecord> {
    return this.educationStructureService.createAcademicYear(body, requireUserId(request));
  }

  @Patch("academic-years/:id")
  @RequirePermissions("education.manageStructure")
  async updateAcademicYear(
    @Param("id") id: string,
    @Body() body: UpdateAcademicYearDto,
    @Req() request: RequestWithUser
  ): Promise<AcademicYearRecord> {
    return this.educationStructureService.updateAcademicYear(id, body, requireUserId(request));
  }

  @Get("terms")
  @RequirePermissions("education.read")
  async listTerms(@Query() query: ListQueryDto): Promise<Paginated<TermRecord>> {
    return this.educationStructureService.listTerms(query);
  }

  @Post("terms")
  @RequirePermissions("education.manageStructure")
  async createTerm(@Body() body: CreateTermDto, @Req() request: RequestWithUser): Promise<TermRecord> {
    return this.educationStructureService.createTerm(body, requireUserId(request));
  }

  @Patch("terms/:id")
  @RequirePermissions("education.manageStructure")
  async updateTerm(
    @Param("id") id: string,
    @Body() body: UpdateTermDto,
    @Req() request: RequestWithUser
  ): Promise<TermRecord> {
    return this.educationStructureService.updateTerm(id, body, requireUserId(request));
  }

  @Get("class-sections")
  @RequirePermissions("education.read")
  async listClassSections(@Query() query: ListQueryDto): Promise<Paginated<SectionRecord>> {
    return this.educationStructureService.listClassSections(query);
  }

  @Get("class-sections/:id/roster")
  @RequirePermissions("education.read", "students.read")
  async getClassSectionRoster(@Param("id") id: string): Promise<ClassSectionRoster> {
    return this.educationStructureService.getClassSectionRoster(id);
  }

  @Post("class-sections")
  @RequirePermissions("education.manageStructure")
  async createClassSection(@Body() body: CreateClassSectionDto, @Req() request: RequestWithUser): Promise<SectionRecord> {
    return this.educationStructureService.createClassSection(body, requireUserId(request));
  }

  @Patch("class-sections/:id")
  @RequirePermissions("education.manageStructure")
  async updateClassSection(
    @Param("id") id: string,
    @Body() body: UpdateClassSectionDto,
    @Req() request: RequestWithUser
  ): Promise<SectionRecord> {
    return this.educationStructureService.updateClassSection(id, body, requireUserId(request));
  }

  @Get("course-classes")
  @RequirePermissions("education.read")
  async listCourseClasses(@Query() query: ListQueryDto): Promise<Paginated<SectionRecord>> {
    return this.educationStructureService.listCourseClasses(query);
  }

  @Post("course-classes")
  @RequirePermissions("education.manageStructure")
  async createCourseClass(@Body() body: CreateCourseClassDto, @Req() request: RequestWithUser): Promise<SectionRecord> {
    return this.educationStructureService.createCourseClass(body, requireUserId(request));
  }

  @Patch("course-classes/:id")
  @RequirePermissions("education.manageStructure")
  async updateCourseClass(
    @Param("id") id: string,
    @Body() body: UpdateCourseClassDto,
    @Req() request: RequestWithUser
  ): Promise<SectionRecord> {
    return this.educationStructureService.updateCourseClass(id, body, requireUserId(request));
  }
}

function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }
  return request.user.id;
}
