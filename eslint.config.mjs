import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
