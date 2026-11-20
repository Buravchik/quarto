import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: [
            "tests/unit/quarto/**/*.test.ts",
            "tests/unit/pieces/**/*.test.ts",
            "tests/unit/play/**/*.test.ts",
            "tests/unit/theme/**/*.test.ts",
            "tests/unit/telegram/**/*.test.ts",
            "tests/contract/**/*.test.ts",
          ],
        },
      },
      {
        esbuild: { jsx: "automatic" },
        test: {
          name: "miniapp",
          environment: "happy-dom",
          include: ["tests/unit/miniapp/**/*.test.tsx", "tests/unit/pieces/**/*.test.tsx"],
        },
      },
    ],
  },
});
