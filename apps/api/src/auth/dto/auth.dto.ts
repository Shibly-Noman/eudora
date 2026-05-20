import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SignupDto {
  @ApiProperty({ example: "person@example.com" })
  email!: string;

  @ApiProperty({ minLength: 12 })
  password!: string;

  @ApiPropertyOptional({ example: "Person Example" })
  name?: string;
}

export class LoginDto {
  @ApiProperty({ example: "person@example.com" })
  email!: string;

  @ApiProperty()
  password!: string;
}

export class BootstrapSuperadminDto extends SignupDto {
  @ApiProperty()
  secret!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  currentPassword!: string;

  @ApiProperty({ minLength: 12 })
  newPassword!: string;
}

export class PublicUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  mustChangePassword!: boolean;
}

export class CurrentUserResponseDto extends PublicUserResponseDto {
  @ApiProperty({ type: [String] })
  permissions!: string[];
}
