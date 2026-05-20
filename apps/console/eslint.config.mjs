import { createEslintConfig } from "../../packages/config/src/eslint.js";

export default createEslintConfig({
  tsconfigRootDir: import.meta.dirname
});
