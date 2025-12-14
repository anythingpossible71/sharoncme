import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import prettier from "eslint-plugin-prettier";

const config = defineConfig([
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    ".turbo/**",
    "uploads/**",
    "db/**",
    "**/__tests__/**",
    "**/(mock)/**",
    "**/(mocks)/**",
    "out/**",
    "next-env.d.ts",
  ]),
  ...nextConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-comment-textnodes": "warn",
      // Downgrade new strict rules to warnings for gradual migration
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default config;
