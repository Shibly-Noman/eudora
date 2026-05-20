import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageRoot = new URL("..", import.meta.url);
const generatedSchema = new URL("src/generated/schema.ts", packageRoot);
const before = readFileSync(generatedSchema, "utf8");

execSync("corepack pnpm generate", {
  cwd: packageRoot,
  stdio: "inherit"
});

const after = readFileSync(generatedSchema, "utf8");

if (before !== after) {
  console.error("Generated API client is stale. Run `corepack pnpm api-client:generate`.");
  process.exit(1);
}
