# Fastify TypeScript Template

A production-ready Fastify template with TypeScript, featuring modular architecture, dependency injection, type-safe database queries, and contract-first API development.

## Features

- **🚀 Fastify** - High-performance web framework
- **📝 TypeScript** - Full type safety and modern JavaScript features
- **💉 Dependency Injection** - Awilix for automatic dependency resolution
- **🔒 Type-Safe APIs** - Contract-first development with ts-rest
- **🗄️ Type-Safe Database** - Kysely query builder with full TypeScript support
- **🔧 Environment Config** - Validated environment variables with Envase & Zod
- **🏗️ Modular Architecture** - Clean separation of concerns with modules
- **✅ Testing** - Vitest for unit and integration tests
- **🔍 Code Quality** - Biome for linting and formatting

## Prerequisites

- Node.js >= 22.18.0
- Docker & Docker Compose (for local database)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd fastify-template
npm install
```

### 2. Environment Setup

Copy the default environment configuration:

```bash
cp .env.default .env
```

The default `.env` file is configured to work with the Docker PostgreSQL instance:

### 3. Start Database

Start the PostgreSQL database using Docker Compose:

```bash
npm run db:start:dev
```

This will start PostgreSQL on port 5432 with the credentials from `.env`.

### 4. Run Migrations

Set up the database schema:

```bash
npm run migrate:latest
```

### 5. Start the Application

Start the development server with hot reload:

```bash
npm run start:dev:watch
```

The API will be available at `http://localhost:3000`

Test the health endpoint:
```bash
curl http://localhost:3000/healthcheck
```

## Project Structure

```
src/
├── app.ts                      # Application setup and bootstrapping
├── server.ts                   # HTTP server configuration
├── main.ts                     # Process entry point
├── infrastructure/             # Core infrastructure
│   ├── config.ts              # Environment configuration
│   ├── coreDiConfig.ts        # Core dependency injection
│   ├── diCommon.ts            # DI utilities
│   ├── AbstractController.ts  # Base controller class
│   └── errors/                # Error handling
├── modules/                    # Feature modules
│   └── users/                 # Example user module
│       ├── controllers/       # HTTP endpoints
│       ├── services/          # Business logic
│       ├── repositories/      # Data access
│       ├── schemas/           # Validation schemas
│       ├── usersDiConfig.ts   # Module DI config
│       └── usersModulePlugin.ts
├── plugins/                    # Fastify plugins
│   └── healthcheckPlugin.ts
└── db/                        # Database types & migrations
    ├── database.ts            # Database schema types
    └── migrations/            # Kysely migrations
```

## Available Scripts

### Development

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start development server |
| `npm run start:dev:watch` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start:prod` | Build and run production server |

### Database

| Script | Description |
|--------|-------------|
| `npm run db:start:dev` | Start PostgreSQL in Docker |
| `npm run db:stop:dev` | Stop PostgreSQL container |
| `npm run migrate:make <name>` | Create a new migration |
| `npm run migrate:up` | Run next migration |
| `npm run migrate:down` | Rollback last migration |
| `npm run migrate:latest` | Run all pending migrations |
| `npm run migrate:rollback` | Rollback all migrations |

### Testing & Quality

| Script | Description |
|--------|-------------|
| `npm test` | Run tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code with Biome and TypeScript |
| `npm run lint:fix` | Auto-fix linting issues |

### Docker

| Script | Description |
|--------|-------------|
| `npm run docker:start:dev` | Start all services (app + database) |
| `npm run docker:stop:dev` | Stop all services |

## Documentation

Detailed documentation is available in the `/docs` directory:

- 📚 [**Project Overview**](./docs/project-overview.md) - Architecture and getting started
- 🔌 [**Fastify Plugins**](./docs/fastify-plugins.md) - Plugin system and patterns
- 💉 [**Dependency Injection**](./docs/dependency-injection.md) - Awilix DI container setup
- 🔧 [**Environment Configuration**](./docs/environment-configuration.md) - Type-safe config management
- 🗄️ [**Kysely Database Setup**](./docs/kysely-setup.md) - Database queries and migrations
- 🏗️ [**Service Layers & Modules**](./docs/service-layers.md) - Modular architecture patterns
- 📝 [**ts-rest Contracts**](./docs/ts-rest-contracts.md) - Contract-first API development

## Development Workflow

### Creating a New Module

1. Create module structure:
```bash
mkdir -p src/modules/:module-name/{controllers,services,repositories,schemas}
```

2. Define schemas and types in `schemas/`
3. Create repository for data access
4. Implement business logic in service
5. Create controller with ts-rest contracts
6. Configure dependency injection
7. Register module plugin

See [Service Layers & Modules](./docs/service-layers.md) for detailed guide.

### Adding Database Tables

1. Create a migration:
```bash
npm run migrate:make create_my_table
```

2. Edit the migration file in `db/migrations/`
3. Run the migration:
```bash
npm run migrate:latest
```

4. Update database types in `db/database.ts`

See [Kysely Database Setup](./docs/kysely-setup.md) for more details.

### API Development

1. Define contracts using ts-rest
2. Implement controllers extending `AbstractController`
3. Contracts provide automatic validation and type safety
4. Generate OpenAPI documentation from contracts

See [ts-rest Contracts](./docs/ts-rest-contracts.md) for patterns and examples.

## Testing

### Unit Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Integration Tests

Tests are located alongside source files with `.spec.ts` extension.

Example test structure:
```
src/modules/users/
├── services/UsersService.ts
├── services/UsersService.spec.ts
├── repositories/UsersRepository.ts
└── repositories/UsersRepository.spec.ts
```
