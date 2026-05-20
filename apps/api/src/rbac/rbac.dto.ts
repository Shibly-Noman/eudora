import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateRoleDto {
  @ApiProperty({ example: "admin" })
  key!: string;

  @ApiProperty({ example: "Admin" })
  name!: string;

  @ApiPropertyOptional({ example: "Can manage users and reports." })
  description?: string;

  @ApiProperty({ type: [String], example: ["users.read", "users.create"] })
  permissionKeys!: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: "Admin" })
  name?: string;

  @ApiPropertyOptional({ example: "Can manage users and reports.", nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: [String], example: ["users.read", "users.create"] })
  permissionKeys?: string[];
}
