import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";

import { RawResponse } from "../common/http/raw-response.decorator.js";
import { HealthResponseDto, UnhealthyResponseDto } from "./health.dto.js";
import { HealthService, type HealthResponse } from "./health.service.js";

@ApiTags("health")
@RawResponse()
@Controller("health")
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({ description: "API and database are healthy.", type: HealthResponseDto })
  @ApiServiceUnavailableResponse({
    description: "A required dependency is unavailable.",
    type: UnhealthyResponseDto
  })
  async getHealth(): Promise<HealthResponse> {
    return this.healthService.getHealth();
  }
}
