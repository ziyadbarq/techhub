# GEMINI.md - Barq Assets Project

This document provides a comprehensive overview of the Barq Assets project, designed to be used as a context file for the Gemini AI assistant.

## Project Overview

Barq Assets is an enterprise-grade **Configuration Management Database (CMDB)** and **IT Asset Management (ITAM)** system. It is built on a modern technology stack and follows a robust architectural pattern.

- **Purpose:** To manage IT assets, configuration items, organizational structures, and service dependencies.
- **Core Technologies:**
    - **Framework:** Next.js 15 (App Router) with React 19
    - **Language:** TypeScript (strict mode)
    - **Styling:** Tailwind CSS 4 with OKLCH color space and shadcn/ui components
    - **Database:** PostgreSQL with Prisma ORM
    - **AI:** OpenAI (GPT-5 family) integration for structured data extraction and other AI-powered features.
- **Architecture:** The project implements a 5-layer **Clean Architecture** with a strict separation of concerns. This design promotes maintainability, scalability, and testability.
    - **Layers:** Presentation (Next.js), Interface Adapters (Controllers/DTOs), Use Cases, Domain (Entities/Interfaces), and Infrastructure (Prisma, APIs).
    - **Patterns:** Dependency Injection (InversifyJS), Repository Pattern, Use Case Pattern, and Domain-Driven Design (DDD).

## Building and Running

The following commands are essential for working with the Barq Assets project.

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and OPENAI_API_KEY

# 3. Initialize database
npm run db:push        # Push Prisma schema to database
npm run db:seed        # Seed prompt blocks (AI infrastructure)
```

### Development

```bash
# Run the development server (with Turbopack)
npm run dev
```

The application will be available at `http://localhost:3000`.

### Testing

```bash
# Run all tests
npm run test

# Run tests with a UI
npm run test:ui

# Perform static type checking
npm run type-check
```

### Production Build

```bash
# Build the application for production
npm run build

# Start the production server
npm run start
```

### Database Management

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Push schema changes to the database (development)
npm run db:push

# Create a new database migration (production)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Development Conventions

The project adheres to a set of conventions to maintain code quality and consistency.

- **Coding Style:**
    - **Formatting:** Code is automatically formatted using **Prettier**.
    - **Linting:** **ESLint** is used to enforce code quality rules.
    - **Hooks:** Pre-commit hooks are managed by **Husky** and **lint-staged** to ensure that code is linted and formatted before being committed.
- **Type Safety:** The project is written entirely in TypeScript with `strict` mode enabled. All new code should be fully type-safe.
- **Error Handling:** The project uses a custom `Result<T, E>` type for type-safe error handling in the core layers.
- **State Management:** While not explicitly stated in the README, the use of React hooks and the clean architecture suggest that state is managed locally in components or through a combination of React Context and server-state management libraries like React Query or SWR (though not explicitly mentioned).
- **Component Library:** The project uses **shadcn/ui** for its UI components. New UI components should be built using these primitives whenever possible.
- **Adding New Features:** The recommended pattern for adding new features is to follow the existing Clean Architecture structure:
    1.  Define a domain entity.
    2.  Create a repository interface.
    3.  Implement the repository in the infrastructure layer.
    4.  Register the new components in the DI container.
    5.  Create use cases for the business logic.
    6.  Implement server actions (controllers).
    7.  Build the UI components.
