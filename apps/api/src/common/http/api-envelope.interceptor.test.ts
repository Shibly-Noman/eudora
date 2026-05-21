import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  type INestApplication,
  Module,
  Query
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { ApiExceptionFilter } from "./api-exception.filter.js";
import { ApiEnvelopeInterceptor } from "./api-envelope.interceptor.js";
import { RawResponse } from "./raw-response.decorator.js";

type SuperTestTarget = Parameters<typeof request>[0];
type EnvelopeBody = {
  meta: {
    timestamp: string;
  };
};
type MaybeEnvelopeBody = {
  success?: boolean;
};

@Controller()
class EnvelopeTestController {
  @Get("business")
  getBusiness() {
    return { id: "user_1", email: "person@example.com" };
  }

  @Get("paginated")
  getPaginated() {
    return {
      items: [{ id: "item_2" }],
      total: 3,
      page: 2,
      pageSize: 1
    };
  }

  @Get("empty")
  @HttpCode(HttpStatus.NO_CONTENT)
  getEmpty(): void {
    return undefined;
  }

  @Get("failure")
  getFailure(): never {
    throw new HttpException(
      {
        message: "Validation failed",
        errors: [{ field: "email", message: "Email must be valid" }]
      },
      HttpStatus.BAD_REQUEST
    );
  }

  @Get("health")
  @RawResponse()
  getHealth(@Query("down") down?: string) {
    if (down) {
      throw new HttpException(
        {
          status: "error",
          services: { api: "ok", database: "error" },
          timestamp: "2026-05-21T00:00:00.000Z"
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: "ok",
      services: { api: "ok", database: "ok" },
      timestamp: "2026-05-21T00:00:00.000Z"
    };
  }
}

@Module({
  controllers: [EnvelopeTestController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ApiEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter }
  ]
})
class EnvelopeTestModule {}

describe("API response envelope", () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
  });

  async function initApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [EnvelopeTestModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it("wraps successful business responses with metadata and request ID", async () => {
    const testApp = await initApp();

    const response = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/business")
      .set("x-request-id", "req_test_1")
      .expect(200);

    expect(response.headers["x-request-id"]).toBe("req_test_1");
    expect(response.body).toMatchObject({
      success: true,
      code: "REQUEST_SUCCESS",
      message: "Request successful",
      data: { id: "user_1", email: "person@example.com" },
      meta: {
        requestId: "req_test_1",
        version: "v1",
        path: "/business",
        method: "GET"
      }
    });
    expect((response.body as EnvelopeBody).meta.timestamp).toEqual(expect.any(String));
  });

  it("moves paginated payload metadata into envelope meta", async () => {
    const testApp = await initApp();

    const response = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/paginated")
      .set("x-request-id", "req_test_page")
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: [{ id: "item_2" }],
      meta: {
        requestId: "req_test_page",
        pagination: {
          page: 2,
          pageSize: 1,
          totalItems: 3,
          totalPages: 3,
          hasNext: true,
          hasPrev: true
        }
      }
    });
  });

  it("leaves 204 responses empty", async () => {
    const testApp = await initApp();

    const response = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/empty")
      .expect(204);

    expect(response.text).toBe("");
  });

  it("wraps business errors with stable error codes and metadata", async () => {
    const testApp = await initApp();

    const response = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/failure")
      .set("x-request-id", "req_bad_input")
      .expect(400);

    expect(response.headers["x-request-id"]).toBe("req_bad_input");
    expect(response.body).toMatchObject({
      success: false,
      code: "BAD_REQUEST",
      message: "Validation failed",
      errors: [{ field: "email", code: "VALIDATION_ERROR", message: "Email must be valid" }],
      meta: {
        requestId: "req_bad_input",
        version: "v1",
        path: "/failure",
        method: "GET"
      }
    });
  });

  it("keeps health success and failure responses raw", async () => {
    const testApp = await initApp();

    const healthy = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/health")
      .expect(200);
    expect(healthy.body).toEqual({
      status: "ok",
      services: { api: "ok", database: "ok" },
      timestamp: "2026-05-21T00:00:00.000Z"
    });
    expect((healthy.body as MaybeEnvelopeBody).success).toBeUndefined();

    const unhealthy = await request(testApp.getHttpServer() as SuperTestTarget)
      .get("/health?down=1")
      .expect(503);
    expect(unhealthy.body).toEqual({
      status: "error",
      services: { api: "ok", database: "error" },
      timestamp: "2026-05-21T00:00:00.000Z"
    });
    expect((unhealthy.body as MaybeEnvelopeBody).success).toBeUndefined();
  });
});
