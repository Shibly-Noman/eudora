import { ApiProperty } from "@nestjs/swagger";

export class HealthServicesDto {
  @ApiProperty({ type: String, enum: ["ok"] })
  api!: "ok";

  @ApiProperty({ type: String, enum: ["ok"] })
  database!: "ok";
}

export class UnhealthyServicesDto {
  @ApiProperty({ type: String, enum: ["ok"] })
  api!: "ok";

  @ApiProperty({ type: String, enum: ["error"] })
  database!: "error";
}

export class HealthResponseDto {
  @ApiProperty({ type: String, enum: ["ok"] })
  status!: "ok";

  @ApiProperty({ type: () => HealthServicesDto })
  services!: HealthServicesDto;

  @ApiProperty({ type: String, format: "date-time" })
  timestamp!: string;
}

export class UnhealthyResponseDto {
  @ApiProperty({ type: String, enum: ["error"] })
  status!: "error";

  @ApiProperty({ type: () => UnhealthyServicesDto })
  services!: UnhealthyServicesDto;

  @ApiProperty({ type: String, format: "date-time" })
  timestamp!: string;
}
