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
      "src/components/ui/data-table.tsx",
      "src/components/**/*-table.tsx",
      "src/components/**/*Table.tsx",
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
                // Exception: structured logger (cross-cutting observability,
                // same precedent as the LogExecution decorator)
                "!@/lib/logger",
                "@/config/**",
                "@/core/use-cases/**",
                // Allow service interfaces (core layer contracts)
                "@/core/services/**",
                "!@/core/services/*.interface",
                "!@/core/services/**/*.interface",
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
      // Business rejections thrown as plain Error are logged at error
      // severity by the controller error handler; domain errors log at warn
      // and keep 4xx/5xx semantics clean.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ThrowStatement > NewExpression[callee.name='Error']",
          message:
            "Throw a domain error (ValidationError, NotFoundError, ...) from @/core/domain/errors instead of a plain Error.",
        },
      ],
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
                // Exception: Allow logging decorator (cross-cutting concern for observability)
                "!@/lib/decorators/log-execution.decorator",
                "!@/lib/decorators",
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
                // Allow service interfaces for type annotations (DI container resolution)
                "!@/core/services/*.interface",
                "!@/core/services/**/*.interface",
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
  // Structured logging policy: console.* bypasses the structured logger (no
  // request context, no redaction). Exemptions, each justified:
  // - logger internals + Prisma bootstrap: console IS their output channel
  // - config/instrumentation bootstrap: runs before the logger exists
  // - seeds + assign-first-admin: CLI utilities where console is the UI
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/generated/**",
      "src/infrastructure/services/logger/**",
      "src/lib/logger.ts",
      "src/lib/logger-state.ts",
      "src/infrastructure/database/prisma/client.ts",
      "src/infrastructure/database/prisma/transaction-context.ts",
      "src/infrastructure/database/prisma/seed*.ts",
      "src/infrastructure/config/cloud-config-init.ts",
      "src/infrastructure/config/cloud-config-loader.ts",
      "src/infrastructure/config/hydrate-settings.ts",
      "src/instrumentation.ts",
      "src/lib/auth/assign-first-admin.ts",
      "src/app/global-error.tsx",
      "**/__tests__/**",
      "**/*.test.{ts,tsx}",
    ],
    rules: {
      "no-console": "error",
    },
  },
  // Client-side code may report failures via console.warn/error (the browser
  // console is the observability channel there); log/info/debug stay banned.
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
      "src/lib/hooks/**/*.{ts,tsx}",
      "src/app/**/*-client.tsx",
    ],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // Relax boundary checks inside tests to allow direct imports for setup/mocking
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": "off",
      // Tests may throw plain Errors to simulate failures
      "no-restricted-syntax": "off",
    },
  },
];
