import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class CreateCampusDto {
  @ApiProperty({ example: "MAIN" })
  code!: string;

  @ApiProperty({ example: "Main Campus" })
  name!: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;
}

export class UpdateCampusDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class CreateProgramDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty({ example: "PRIMARY" })
  code!: string;

  @ApiProperty({ example: "Primary School" })
  name!: string;

  @ApiPropertyOptional()
  description?: string;
}

export class UpdateProgramDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  description?: string | null;
}

export class CreateAcademicYearDto {
  @ApiProperty({ example: "2026-2027" })
  code!: string;

  @ApiProperty({ example: "Academic Year 2026-2027" })
  name!: string;

  @ApiProperty({ example: "2026-08-01" })
  startsOn!: string;

  @ApiProperty({ example: "2027-06-30" })
  endsOn!: string;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class UpdateAcademicYearDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  startsOn?: string;

  @ApiPropertyOptional()
  endsOn?: string;

  @ApiPropertyOptional()
  isActive?: boolean;
}

export class CreateTermDto {
  @ApiProperty()
  academicYearId!: string;

  @ApiProperty({ example: "T1" })
  code!: string;

  @ApiProperty({ example: "Term 1" })
  name!: string;

  @ApiProperty({ example: "2026-08-01" })
  startsOn!: string;

  @ApiProperty({ example: "2026-12-15" })
  endsOn!: string;
}

export class UpdateTermDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  startsOn?: string;

  @ApiPropertyOptional()
  endsOn?: string;
}

export class CreateClassSectionDto {
  @ApiProperty()
  campusId!: string;

  @ApiProperty()
  programId!: string;

  @ApiProperty()
  academicYearId!: string;

  @ApiPropertyOptional()
  termId?: string | null;

  @ApiProperty({ example: "G1-A" })
  code!: string;

  @ApiProperty({ example: "Grade 1 A" })
  name!: string;

  @ApiPropertyOptional()
  capacity?: number | null;
}

export class UpdateClassSectionDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  capacity?: number | null;
}

export class CreateCourseClassDto extends CreateClassSectionDto {}

export class UpdateCourseClassDto extends UpdateClassSectionDto {}
