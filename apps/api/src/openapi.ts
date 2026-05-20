import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Eudora API")
    .setDescription("REST API for the Eudora monorepo scaffold.")
    .setVersion("0.0.0")
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupOpenApi(app: INestApplication): void {
  const document = createOpenApiDocument(app);

  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json"
  });
}
