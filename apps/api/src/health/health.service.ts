import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";

export type HealthResponse = {
  status: "ok";
  services: {
    api: "ok";
    database: "ok";
  };
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.checkConnection();
    } catch {
      throw new ServiceUnavailableException({
        status: "error",
        services: {
          api: "ok",
          database: "error"
        },
        timestamp
      });
    }

    return {
      status: "ok",
      services: {
        api: "ok",
        database: "ok"
      },
      timestamp
    };
  }
}
