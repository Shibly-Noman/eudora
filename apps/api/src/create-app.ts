import { type INestApplication, type LoggerService, type LogLevel } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { setupOpenApi } from "./openapi.js";

type CreateAppOptions = {
  logger?: false | LoggerService | LogLevel[];
  openApi?: boolean;
};

export async function createApp(options: CreateAppOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: options.logger ?? ["log", "error", "warn"]
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true
  });

  if (options.openApi ?? true) {
    setupOpenApi(app);
  }

  return app;
}
