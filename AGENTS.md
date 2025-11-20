# AGENT PLAYBOOK

Use this document when contributing code via autonomous agents.

---

## High-Level Architecture
- **Next.js 16 + React 19** front end in `src/app`. Server components handle auth/redirects, client components live under `src/components`.
- **Clean Architecture**:
  - `src/core`: domain entities (`Task`, `Role`, `UserRole`), value objects (`permission-key`), use cases (e.g., `CheckPermissionUseCase`), and interfaces.
  - `src/interface-adapters`: controllers, DTOs, presenters.
  - `src/infrastructure`: Prisma repositories, queue/email/logger implementations, Better Auth config.
  - `src/di`: Inversify container + module bindings.
- **Prisma 7** with the Rust-free `PrismaClient` in `src/infrastructure/database/prisma/client.ts`; always reuse that singleton via DI.
- **Auth/RBAC** powered by Better Auth (`src/lib/auth/better-auth.ts`) plus custom RBAC use cases, caches, and UI guards (`src/components/auth/*`).
- **Workers/Jobs** implemented with BullMQ in `src/infrastructure/services/queue`.

See `docs/architecture/RBAC_ARCHITECTURE.md`, `docs/guides/RBAC_DEVELOPER_GUIDE.md`, and `CLAUDE.md` → “Everyday Workflow” for deeper context.

---

## Workflow & Commands
- `npm run dev` → Next dev server (Turbopack). Use `npm run dev:clean` if caches glitch.
- `npm run validate` → full CI pipeline (`type-check`, `lint`, `test`). Run before pushing/handing off.
- `npm run lint` / `npm run type-check` / `npm run test` → individual checks.
- `npm run db:push`, `npm run db:seed`, `npm run db:generate` → Prisma tasks (load env via `.env.local`).
- `npm run cache:clear` / `npm run reset` → blow away `.next` caches or rebuild DB + caches completely.

Agents should always run `npm run validate` after non-trivial edits.

---

## DO / DON'T

### DO
- **Use the DI container**: Resolve repositories/use cases via `getContainer()` or `resolve()` inside API routes and workers. Bind new services in `src/di/modules/*`.
- **Use `getSession()`**: All server components/routes must call `src/lib/auth/session.ts` instead of hand-rolling Better Auth calls. Redirect/throw if no session.
- **Follow Clean Architecture**: UI → controller → use case → repository → Prisma. Keep business logic in use cases/entities.
- **Reuse permission helpers**: `permissionCache`, `hasAnyPermission`, `CheckPermissionUseCase`. Ownership rules already live there.
- **Log via `ILoggerService`**: inject and call `logger.debug/info/warn/error`. Use `startTimer/endTimer` for DB/cache instrumentation.
- **Keep code typed**: Use explicit types, `as const`, and generated Prisma types from `@/generated/prisma`.
- **Run tests**: At minimum `npm run lint` + `npm run type-check`. Prefer `npm run validate`.
- **Document changes**: Update relevant docs if behavior, env vars, or workflows change.

### DON'T
- **Don’t instantiate Prisma/Pool manually**: Always import from `src/infrastructure/database/prisma/client.ts`.
- **Don’t bypass auth helpers**: Never call Better Auth APIs directly from components; wrap through `getSession()`/API routes.
- **Don’t mix layers**: UI components shouldn’t import infrastructure repositories; go through controllers/use cases.
- **Don’t skip DI bindings**: New repositories/services must have DI tokens and be registered; otherwise runtime resolution fails.
- **Don’t commit secrets**: `.env.local`, service keys, or Prisma `.env` files must stay local.
- **Don’t ignore lint-staged errors**: Hooks enforce formatting and type checks on staged files—fix and restage.
- **Don’t push unvalidated code**: Always run the validation pipeline before raising a PR or finalizing an agent run.

---

## Additional Tips
- When editing RBAC/auth flows, also review `docs/guides/LOGGING.md`, `docs/guides/FIRST_USER_ADMIN.md`, and `docs/guides/RBAC_*` for consistency.
- UI components rely on shadcn patterns; keep styling via Tailwind classes (auto-sorted by Prettier).
- Integration tests under `tests/` may hit the database; ensure your local `.env.local` points to a scratch DB before running.
- For large refactors, update `CLAUDE.md` and `AGENTS.md` to keep future agents aligned with new practices.
