import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListFamiliesQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class WizardFamilyDto {
  @ApiProperty({ example: "FAM-001" })
  familyCode!: string;

  @ApiProperty({ example: "Rahman Family" })
  displayName!: string;

  @ApiPropertyOptional()
  primaryEmail?: string;

  @ApiPropertyOptional()
  primaryPhone?: string;
}

export class WizardGuardianDto {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  userId?: string | null;
}

export class WizardStudentDto {
  @ApiProperty()
  studentNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  gender?: string | null;

  @ApiPropertyOptional()
  userId?: string | null;
}

export class WizardRelationshipDto {
  @ApiProperty({ example: "mother" })
  relationshipType!: string;

  @ApiPropertyOptional()
  isPrimaryContact?: boolean;

  @ApiPropertyOptional()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional()
  isPickupAuthorized?: boolean;

  @ApiPropertyOptional()
  isBillingResponsible?: boolean;

  @ApiPropertyOptional()
  hasPortalAccess?: boolean;

  @ApiPropertyOptional()
  canApproveRequests?: boolean;
}

export class WizardPrimaryPlacementDto {
  @ApiProperty()
  classSectionId!: string;

  @ApiProperty()
  academicYearId!: string;

  @ApiProperty({ example: "2026-08-01" })
  startsOn!: string;
}

export class CreateFamilyWizardDto {
  @ApiProperty()
  family!: WizardFamilyDto;

  @ApiProperty()
  guardian!: WizardGuardianDto;

  @ApiProperty()
  student!: WizardStudentDto;

  @ApiProperty()
  relationship!: WizardRelationshipDto;

  @ApiPropertyOptional()
  primaryPlacement?: WizardPrimaryPlacementDto;
}

export class UpdateFamilyDto {
  @ApiPropertyOptional()
  displayName?: string;

  @ApiPropertyOptional()
  primaryEmail?: string | null;

  @ApiPropertyOptional()
  primaryPhone?: string | null;

  @ApiPropertyOptional()
  addressLine1?: string | null;

  @ApiPropertyOptional()
  addressLine2?: string | null;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  state?: string | null;

  @ApiPropertyOptional()
  postalCode?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional()
  status?: string;
}

export class GuardianStudentLinkDto {
  @ApiPropertyOptional()
  guardianId?: string;

  @ApiPropertyOptional()
  studentId?: string;

  @ApiProperty({ example: "mother" })
  relationshipType!: string;

  @ApiPropertyOptional()
  isPrimaryContact?: boolean;

  @ApiPropertyOptional()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional()
  isPickupAuthorized?: boolean;

  @ApiPropertyOptional()
  isBillingResponsible?: boolean;

  @ApiPropertyOptional()
  hasPortalAccess?: boolean;

  @ApiPropertyOptional()
  canApproveRequests?: boolean;
}

export class AddGuardianDto {
  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ type: [GuardianStudentLinkDto] })
  studentRelationships?: Array<GuardianStudentLinkDto & { studentId: string }>;
}

export class AddStudentDto {
  @ApiProperty()
  studentNumber!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  gender?: string | null;

  @ApiPropertyOptional()
  isPrimaryHousehold?: boolean;

  @ApiPropertyOptional()
  livesWithFamily?: boolean;

  @ApiPropertyOptional({ type: [GuardianStudentLinkDto] })
  guardianRelationships?: Array<GuardianStudentLinkDto & { guardianId: string }>;
}

export class UpdateStudentDto {
  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  dateOfBirth?: string | null;

  @ApiPropertyOptional()
  gender?: string | null;
}

export class LinkGuardianUserDto {
  @ApiProperty()
  userId!: string;
}

export class UpdateGuardianStudentRelationshipDto {
  @ApiPropertyOptional()
  relationshipType?: string;

  @ApiPropertyOptional()
  isPrimaryContact?: boolean;

  @ApiPropertyOptional()
  isEmergencyContact?: boolean;

  @ApiPropertyOptional()
  isPickupAuthorized?: boolean;

  @ApiPropertyOptional()
  isBillingResponsible?: boolean;

  @ApiPropertyOptional()
  hasPortalAccess?: boolean;

  @ApiPropertyOptional()
  canApproveRequests?: boolean;
}
