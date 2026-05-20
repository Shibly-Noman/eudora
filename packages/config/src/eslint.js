import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

/**
 * @param {{ tsconfigRootDir: string }} options
 */
export function createEslintConfig({ tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: [
        "**/dist/**",
        "**/.next/**",
        "**/coverage/**",
        "**/node_modules/**",
        "**/*.d.ts",
        "**/*.d.ts.map",
        "**/*.js.map",
        "**/tsconfig*.tsbuildinfo",
        "**/src/generated/**",
        "**/openapi.json"
      ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir
        }
      },
      rules: {
        "@typescript-eslint/consistent-type-imports": [
          "error",
          {
            "prefer": "type-imports"
          }
        ],
        "@typescript-eslint/no-floating-promises": "error"
      }
    },
    {
      files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
      languageOptions: {
        globals: {
          console: "readonly",
          process: "readonly",
          URL: "readonly"
        }
      },
      extends: [tseslint.configs.disableTypeChecked]
    },
    eslintConfigPrettier
  );
}
