import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateManagedUserDto {
  @ApiProperty({ example: "person@example.com" })
  email!: string;

  @ApiProperty({ minLength: 12 })
  password!: string;

  @ApiPropertyOptional({ example: "Person Example" })
  name?: string;

  @ApiProperty({ type: [String], example: ["admin"] })
  roleKeys!: string[];
}

export class ReplaceUserRolesDto {
  @ApiProperty({ type: [String], example: ["manager", "viewer"] })
  roleKeys!: string[];
}
