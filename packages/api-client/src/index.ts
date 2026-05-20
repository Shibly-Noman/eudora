import createClient, { type Client } from "openapi-fetch";

import type { paths } from "./generated/schema.js";

export type { components, paths } from "./generated/schema.js";

export function createApiClient(baseUrl = "http://localhost:3001"): Client<paths> {
  return createClient<paths>({
    baseUrl
  });
}
