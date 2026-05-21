import { describe, expect, it } from "vitest";

import { wrapBusinessResponsesWithApiEnvelope } from "./openapi.js";

type OpenApiResponses = Record<
  string,
  {
    content?: Record<string, { schema: unknown }>;
    description?: string;
  }
>;

describe("OpenAPI response envelope", () => {
  it("wraps business responses while leaving health and 204 responses raw", () => {
    const document = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "0.0.0" },
      paths: {
        "/users": {
          get: {
            responses: {
              "200": {
                description: "Users fetched"
              }
            }
          }
        },
        "/auth/logout": {
          post: {
            responses: {
              "204": {
                description: "Logged out"
              }
            }
          }
        },
        "/health": {
          get: {
            responses: {
              "200": {
                description: "API is healthy",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/HealthResponseDto" }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          HealthResponseDto: {
            type: "object"
          }
        }
      }
    };

    wrapBusinessResponsesWithApiEnvelope(document);
    const userResponses = document.paths["/users"].get.responses as OpenApiResponses;
    const logoutResponses = document.paths["/auth/logout"].post.responses as OpenApiResponses;
    const healthResponses = document.paths["/health"].get.responses as OpenApiResponses;
    const schemas = document.components.schemas as Record<string, unknown>;

    expect(schemas.ApiEnvelope).toBeDefined();
    expect(schemas.ApiErrorEnvelope).toBeDefined();
    expect(userResponses["200"]?.content).toEqual({
      "application/json": {
        schema: {
          allOf: [
            { $ref: "#/components/schemas/ApiEnvelope" },
            {
              type: "object",
              properties: {
                data: { nullable: true }
              }
            }
          ]
        }
      }
    });
    expect(userResponses.default?.content?.["application/json"]?.schema).toEqual({
      $ref: "#/components/schemas/ApiErrorEnvelope"
    });
    expect(logoutResponses["204"]?.content).toBeUndefined();
    expect(healthResponses["200"]?.content).toEqual({
      "application/json": {
        schema: { $ref: "#/components/schemas/HealthResponseDto" }
      }
    });
    expect(healthResponses.default).toBeUndefined();
  });
});
