import { writeFile } from "node:fs/promises";

import { createApp } from "./create-app.js";
import { createOpenApiDocument } from "./openapi.js";

const app = await createApp({ logger: false, openApi: false });
const document = createOpenApiDocument(app);
const outputUrl = new URL("../openapi.json", import.meta.url);

await writeFile(outputUrl, `${JSON.stringify(document, null, 2)}\n`);
await app.close();
