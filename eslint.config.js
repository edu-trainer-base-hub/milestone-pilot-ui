import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
      // eslint-config-prettier disables conflict-prone rules
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { projectService: true },
      globals: globals.browser,
    },
    // Plugins removed (prettier no longer runs in eslint)
    plugins: {},
    rules: {
      // Prettier rule removed
    },
    ignores: ["dist", "node_modules"],
  },
  // Add prettier config at the end to override other configs
  prettier,
]);
