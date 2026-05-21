import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ReplacePrimaryPlacementDto {
  @ApiProperty()
  classSectionId!: string;

  @ApiProperty()
  academicYearId!: string;

  @ApiProperty({ example: "2026-08-01" })
  startsOn!: string;

  @ApiPropertyOptional()
  replaceExisting?: boolean;
}

export class CreateCourseEnrollmentDto {
  @ApiProperty()
  courseClassId!: string;

  @ApiProperty({ example: "2026-08-01" })
  enrolledOn!: string;
}

export class EnrollmentListQueryDto {
  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}
