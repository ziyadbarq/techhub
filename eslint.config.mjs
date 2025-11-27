import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "data/**",
      "pages/dist/**",
      "src/generated/**",
      ".turbo/**",
      "*.config.js",
      "*.config.ts",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // React Hooks plugin with flat config (React 19 recommended pattern)
  {
    ...reactHooksPlugin.configs.flat.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  // React Compiler plugin for automatic memoization and optimization
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
  },
  // Disable React Compiler warnings for TanStack Table components (known incompatibility with v8)
  // See: https://github.com/TanStack/table/issues/5567
  // TODO: Remove when upgrading to TanStack Table v9
  {
    files: [
      "src/components/asset-disposals/asset-disposals-table.tsx",
      "src/components/asset-kits/kit-checkouts-table.tsx",
      "src/components/asset-reservations/asset-reservations-table.tsx",
      "src/components/ci-classes/ci-classes-table.tsx",
      "src/components/relationship-types/relationship-types-table.tsx",
      "src/components/configuration-items/configuration-items-table.tsx",
      "src/components/ci-relationships/ci-relationships-table.tsx",
      "src/components/asset-kits/asset-kits-table.tsx",
      "src/components/ui/data-table.tsx",
    ],
    rules: {
      "react-compiler/react-compiler": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Next.js uses the new JSX transform, so React doesn't need to be in scope
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Allow unused variables/parameters that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Enforce consistent type imports (use 'import type' for type-only imports)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      // Prevent imports from @prisma/client (use @/generated/prisma instead)
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@prisma/client/*"],
              message:
                "Import from '@/generated/prisma' (browser-safe) or '@/generated/prisma/server' (server-only). See PRISMA_GUIDE.md.",
            },
          ],
        },
      ],
    },
  },
  // Prevent server-only Prisma imports in client components
  {
    files: [
      "src/components/**/*.tsx",
      "src/components/**/*.ts",
      "src/**/*-page-client.tsx",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/generated/prisma/server",
              message:
                "Cannot import server-only module in client components. Use '@/generated/prisma' or '@/generated/prisma/enums' instead.",
            },
            {
              name: "@/generated/prisma/client",
              message:
                "Cannot import Prisma client in client components. Use '@/generated/prisma' or '@/generated/prisma/enums' instead.",
            },
          ],
          patterns: [
            {
              group: ["@prisma/client", "@prisma/client/*"],
              message:
                "Import from '@/generated/prisma' (browser-safe) or '@/generated/prisma/enums'. See PRISMA_GUIDE.md.",
            },
          ],
        },
      ],
    },
  },
];
