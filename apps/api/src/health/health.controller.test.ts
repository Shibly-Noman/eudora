import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "../app.module.js";
import { PrismaService } from "../prisma/prisma.service.js";

type SuperTestTarget = Parameters<typeof request>[0];

type HealthBody = {
  status: "ok" | "error";
  services: {
    api: "ok";
    database: "ok" | "error";
  };
  timestamp: string;
};

describe("GET /health", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it("returns API and database health status", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue({
        checkConnection: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined)
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer() as SuperTestTarget)
      .get("/health")
      .expect(200);
    const body = response.body as HealthBody;

    expect(body).toMatchObject({
      status: "ok",
      services: {
        api: "ok",
        database: "ok"
      }
    });
    expect(body.timestamp).toEqual(expect.any(String));
  });

  it("returns service unavailable when the database check fails", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue({
        checkConnection: vi.fn().mockRejectedValue(new Error("database unavailable")),
        close: vi.fn().mockResolvedValue(undefined)
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer() as SuperTestTarget)
      .get("/health")
      .expect(503);
    const body = response.body as HealthBody;

    expect(body).toMatchObject({
      status: "error",
      services: {
        api: "ok",
        database: "error"
      }
    });
    expect(body.timestamp).toEqual(expect.any(String));
  });
});
