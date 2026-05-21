import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

type JsonSchema = Record<string, unknown>;
type OpenApiMediaType = {
  schema?: JsonSchema;
};
type OpenApiResponse = {
  content?: Record<string, OpenApiMediaType>;
  description?: string;
};
type OpenApiOperation = {
  responses?: Record<string, OpenApiResponse>;
};
type EnvelopeOpenApiDocument = {
  components?: {
    schemas?: Record<string, unknown>;
  };
  paths?: Record<string, Record<string, unknown> | undefined>;
};

const HTTP_METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch", "trace"]);

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Eudora API")
    .setDescription("REST API for the Eudora monorepo scaffold.")
    .setVersion("0.0.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  wrapBusinessResponsesWithApiEnvelope(document as unknown as EnvelopeOpenApiDocument);
  return document;
}

export function setupOpenApi(app: INestApplication): void {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json"
  });
}

export function wrapBusinessResponsesWithApiEnvelope(document: EnvelopeOpenApiDocument): void {
  const schemas = ensureSchemas(document);

  schemas.ApiPaginationMeta = {
    type: "object",
    required: ["page", "pageSize", "totalItems", "totalPages", "hasNext", "hasPrev"],
    properties: {
      page: { type: "number" },
      pageSize: { type: "number" },
      totalItems: { type: "number" },
      totalPages: { type: "number" },
      hasNext: { type: "boolean" },
      hasPrev: { type: "boolean" }
    }
  };
  schemas.ApiMeta = {
    type: "object",
    required: ["requestId", "timestamp", "version", "path", "method"],
    properties: {
      requestId: { type: "string" },
      timestamp: { type: "string", format: "date-time" },
      version: { type: "string", enum: ["v1"] },
      path: { type: "string" },
      method: { type: "string" },
      pagination: { $ref: "#/components/schemas/ApiPaginationMeta" }
    }
  };
  schemas.ApiEnvelope = {
    type: "object",
    required: ["success", "code", "message", "data", "meta"],
    properties: {
      success: { type: "boolean", enum: [true] },
      code: { type: "string" },
      message: { type: "string" },
      data: { nullable: true },
      meta: { $ref: "#/components/schemas/ApiMeta" }
    }
  };
  schemas.ApiErrorDetail = {
    type: "object",
    required: ["code", "message"],
    properties: {
      field: { type: "string" },
      code: { type: "string" },
      message: { type: "string" }
    }
  };
  schemas.ApiErrorEnvelope = {
    type: "object",
    required: ["success", "code", "message", "meta"],
    properties: {
      success: { type: "boolean", enum: [false] },
      code: { type: "string" },
      message: { type: "string" },
      errors: {
        type: "array",
        items: { $ref: "#/components/schemas/ApiErrorDetail" }
      },
      meta: { $ref: "#/components/schemas/ApiMeta" }
    }
  };

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || isRawOpenApiPath(path)) {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || !isOperation(operation)) {
        continue;
      }

      wrapOperationResponses(operation);
    }
  }
}

function ensureSchemas(document: EnvelopeOpenApiDocument): Record<string, unknown> {
  document.components ??= {};
  document.components.schemas ??= {};
  return document.components.schemas;
}

function wrapOperationResponses(operation: OpenApiOperation): void {
  const responses = operation.responses;

  if (!responses) {
    return;
  }

  for (const [statusCode, response] of Object.entries(responses)) {
    if (!isSuccessfulResponseCode(statusCode) || statusCode === "204") {
      continue;
    }

    response.content = {
      ...response.content,
      "application/json": {
        ...response.content?.["application/json"],
        schema: successEnvelopeSchema(response.content?.["application/json"]?.schema)
      }
    };
  }

  responses.default ??= {
    description: "Error response",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiErrorEnvelope" }
      }
    }
  };
}

function successEnvelopeSchema(dataSchema: JsonSchema | undefined): JsonSchema {
  return {
    allOf: [
      { $ref: "#/components/schemas/ApiEnvelope" },
      {
        type: "object",
        properties: {
          data: dataSchema ?? { nullable: true }
        }
      }
    ]
  };
}

function isSuccessfulResponseCode(statusCode: string): boolean {
  const numericStatus = Number.parseInt(statusCode, 10);
  return Number.isFinite(numericStatus) && numericStatus >= 200 && numericStatus < 400;
}

function isRawOpenApiPath(path: string): boolean {
  return path === "/health";
}

function isOperation(value: unknown): value is OpenApiOperation {
  return typeof value === "object" && value !== null && "responses" in value;
}
