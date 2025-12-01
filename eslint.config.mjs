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
  // Layer boundary rules (warn-only while violations are being fixed)
  {
    files: ["src/core/domain/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/components/**",
                "@/contexts/**",
                "@/hooks/**",
                "@/interface-adapters/**",
                "@/infrastructure/**",
                "@/lib/**",
                "@/config/**",
                "@/core/use-cases/**",
                "@/core/services/**",
              ],
              message:
                "Domain layer must stay pure; do not depend on outer layers or lib helpers.",
            },
            {
              group: ["@/generated/prisma/server", "@/generated/prisma/client"],
              message: "Domain cannot import PrismaClient; use enums/types only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/core/use-cases/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@/app/**",
                "@/components/**",
                "@/contexts/**",
                "@/hooks/**",
                "@/interface-adapters/**",
                "@/infrastructure/**",
                "@/lib/**",
              ],
              message:
                "Use cases depend only on domain/services/contracts; route through adapters for everything else.",
            },
            {
              group: ["@/generated/prisma/server", "@/generated/prisma/client"],
              message:
                "Use cases should not import PrismaClient; rely on repositories.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/interface-adapters/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/infrastructure/**", "@/app/**"],
              message:
                "Interface adapters should not depend on infrastructure or presentation layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/interface-adapters/**", "@/app/**"],
              message:
                "Infrastructure implementations should not import adapters or presentation code.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@/interface-adapters/**", "@/infrastructure/**", "@/app/**"],
              message:
                "Shared lib utilities must stay free of presentation or adapter coupling.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: [
                "@/core/use-cases/**",
                "@/core/repositories/**",
                "@/core/services/**",
                "@/core/domain/entities/**",
                "@/core/domain/events/**",
                "@/infrastructure/**",
              ],
              message:
                "Presentation should depend on controllers/queries, not core or infrastructure directly.",
            },
          ],
        },
      ],
    },
  },
  // Relax boundary checks inside tests to allow direct imports for setup/mocking
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": "off",
    },
  },
];
