# Project Overview

This Fastify template provides a production-ready foundation for building scalable TypeScript APIs with a focus on clean architecture, dependency injection, and type-safe contract-driven development.

## Architecture Principles

### Clean Architecture
The project follows clean architecture principles with clear separation of concerns:

- **Controllers** - Handle HTTP requests and responses using ts-rest contracts
- **Services** - Contain business logic and orchestration
- **Repositories** - Manage data access and persistence
- **Infrastructure** - Cross-cutting concerns like DI, configuration, and error handling

### Modular Design
Features are organized into self-contained modules under `src/modules/`. Each module contains:

- Controllers for HTTP endpoints
- Services for business logic
- Repositories for data access
- Schemas for validation and typing
- Module-specific DI configuration
- Module plugin for registration

### Key Technologies

- **Fastify** - High-performance web framework
- **TypeScript** - Type safety and modern JavaScript features
- **Awilix** - Powerful dependency injection container
- **ts-rest** - Contract-first API development with end-to-end type safety
- **Kysely** - Type-safe SQL query builder
- **Zod** - Schema validation for runtime safety
- **Envase** - Type-safe environment variable management

## Project Structure

```
src/
├── app.ts                 # Application setup and bootstrapping
├── server.ts             # Server entry point
├── main.ts               # Process entry point
├── infrastructure/       # Core infrastructure code
│   ├── config.ts        # Environment configuration
│   ├── coreDiConfig.ts  # Core dependency injection setup
│   ├── diCommon.ts      # DI utility functions
│   ├── AbstractController.ts # Base controller class
│   └── errors/          # Error handling utilities
├── modules/             # Feature modules
│   └── users/          # Example users module
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── schemas/
│       ├── usersDiConfig.ts
│       └── usersModulePlugin.ts
└── plugins/            # Fastify plugins
    └── healthcheckPlugin.ts
```

## Core Features

### Type Safety
End-to-end type safety from database queries through API contracts to client responses.

### Dependency Injection
Automatic dependency resolution with Awilix for better testability and maintainability.

### Contract-First Development
API contracts defined with ts-rest ensure consistency between backend and frontend.

### Environment Configuration
Strongly typed environment variables with validation at startup.

### Error Handling
Centralized error handling with proper error types and HTTP status codes.

### Modular Architecture
Easy to add new features as self-contained modules with their own dependencies.

## Getting Started

1. Configure environment variables (see [Environment Configuration](./environment-configuration.md))
2. Set up database connection (see [Kysely Database Setup](./kysely-setup.md))
3. Understand the DI system (see [Dependency Injection](./dependency-injection.md))
4. Learn about modules (see [Service Layers & Modules](./service-layers.md))
5. Define API contracts (see [ts-rest Contracts](./ts-rest-contracts.md))
6. Create Fastify plugins (see [Fastify Plugins](./fastify-plugins.md))