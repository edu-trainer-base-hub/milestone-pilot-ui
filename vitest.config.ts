import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true, // expose global expect/it/describe
    // Playwright owns e2e/ — its *.spec.ts files must not run under Vitest
    exclude: ["**/node_modules/**", "e2e/**"],
  },
});
