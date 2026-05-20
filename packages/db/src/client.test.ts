import { describe, expect, it } from "vitest";

import { resolveDatabaseUrl } from "./client.js";

describe("resolveDatabaseUrl", () => {
  it("returns an explicitly provided database URL", () => {
    expect(resolveDatabaseUrl("postgresql://user:pass@localhost:5432/db")).toBe(
      "postgresql://user:pass@localhost:5432/db"
    );
  });

  it("returns DATABASE_URL from the provided environment", () => {
    expect(resolveDatabaseUrl(undefined, { DATABASE_URL: "postgresql://env/db" })).toBe(
      "postgresql://env/db"
    );
  });

  it("throws when no database URL is available", () => {
    expect(() => resolveDatabaseUrl(undefined, {})).toThrow("DATABASE_URL is required");
  });
});
