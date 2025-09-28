# Environment Configuration

This project uses **Envase** with **Zod** for type-safe environment variable management, ensuring configuration errors are caught at startup rather than runtime.

## Overview

Environment configuration provides:
- **Type safety** - Environment variables are strongly typed
- **Validation** - Values are validated at startup using Zod schemas
- **Early failure** - Invalid configuration prevents app startup
- **IntelliSense** - Full TypeScript autocompletion for config values
- **Documentation** - Schema serves as documentation for required variables

## Configuration Schema

### Schema Definition

The configuration schema is defined in `src/infrastructure/config.ts`:

```typescript
import { envvar, type InferEnv, parseEnv } from "envase";
import { z } from "zod";

const CONFIG_SCHEMA = {
  db: {
    database: envvar("DB_DATABASE", z.string().min(1)),
    host: envvar("DB_HOST", z.string().min(1)),
    user: envvar("DB_USER", z.string().min(1)),
    password: envvar("DB_PASSWORD", z.string().min(1)),
    port: envvar("DB_PORT", z.coerce.number().min(1)),
    max: envvar("DB_MAX_CONNECTIONS", z.coerce.number().min(1)),
  },
} as const;

export const generateConfig = () => {
  return parseEnv(process.env, CONFIG_SCHEMA);
};

export type Config = InferEnv<typeof CONFIG_SCHEMA>;
```

### Current Configuration

The project currently requires these environment variables:

| Variable | Type | Description | Validation |
|----------|------|-------------|------------|
| `DB_DATABASE` | string | Database name | Required, non-empty |
| `DB_HOST` | string | Database host | Required, non-empty |
| `DB_USER` | string | Database username | Required, non-empty |
| `DB_PASSWORD` | string | Database password | Required, non-empty |
| `DB_PORT` | number | Database port | Required, positive number |
| `DB_MAX_CONNECTIONS` | number | Connection pool size | Required, positive number |

## How It Works

### 1. Schema Definition
Each environment variable is defined using `envvar()`:

```typescript
envvar("VARIABLE_NAME", zodSchema)
```

### 2. Parsing
At startup, `parseEnv()` parses and validates all environment variables:

```typescript
export const generateConfig = () => {
  return parseEnv(process.env, CONFIG_SCHEMA);
};
```

### 3. Type Inference
TypeScript infers types from the schema:

```typescript
export type Config = InferEnv<typeof CONFIG_SCHEMA>;
// Result:
// {
//   db: {
//     database: string;
//     host: string;
//     user: string;
//     password: string;
//     port: number;
//     max: number;
//   }
// }
```

### 4. Dependency Injection
Config is registered as a singleton dependency:

```typescript
// src/infrastructure/coreDiConfig.ts
config: asSingletonFunction(() => generateConfig()),
```

### 5. Usage
Inject and use the typed config:

```typescript
export class DatabaseService {
  private readonly config: Config;

  constructor(dependencies: { config: Config }) {
    this.config = dependencies.config;
  }

  connect() {
    const pool = new Pool({
      database: this.config.db.database,
      host: this.config.db.host,
      user: this.config.db.user,
      password: this.config.db.password,
      port: this.config.db.port,
      max: this.config.db.max,
    });
  }
}
```

## Adding New Configuration

### Step 1: Update Schema

Add new configuration to the schema in `src/infrastructure/config.ts`:

```typescript
const CONFIG_SCHEMA = {
  db: {
    // ... existing db config
  },
  app: {
    port: envvar("APP_PORT", z.coerce.number().default(3000)),
    host: envvar("APP_HOST", z.string().default("0.0.0.0")),
    logLevel: envvar("LOG_LEVEL",
      z.enum(["debug", "info", "warn", "error"]).default("info")
    ),
  },
  auth: {
    jwtSecret: envvar("JWT_SECRET", z.string().min(32)),
    jwtExpiry: envvar("JWT_EXPIRY", z.string().default("1h")),
  },
  redis: {
    url: envvar("REDIS_URL", z.string().url().optional()),
  },
} as const;
```

### Step 2: Update .env.default

Add the new variables to `.env.default` with example values:

```bash
# .env.default
DB_DATABASE=service_db
#...

# New variables
REDIS_URL=redis://localhost:6379  # Optional
```

This ensures other developers know what environment variables are needed.

### Step 3: Use in Code

Access new config values with type safety:

```typescript
constructor(dependencies: { config: Config }) {
  this.port = dependencies.config.app.port;
  this.jwtSecret = dependencies.config.auth.jwtSecret;
}
```

### Development Setup

Create a `.env` file for local development:

```bash
# .env
DB_DATABASE=service_db
DB_HOST=localhost
DB_USER=serviceuser
DB_PASSWORD=pass
DB_PORT=5432
DB_MAX_CONNECTIONS=10
```

### Loading Environment Files

This project uses Node.js native `--env-file` flag (available in Node.js 20.6+):

```json
// package.json scripts
{
  "start:dev": "node --env-file=.env src/main.ts",
  "start:dev:watch": "node --watch --env-file=.env src/server.ts",
  "start:prod": "node --env-file-if-exists=.env dist/server.js"
}
```

### Multiple Environment Files

For different environments, specify different files:

```bash
# Development (default)
node --env-file=.env src/main.ts

# Testing
node --env-file=.env.test src/main.ts

# Production (optional loading)
node --env-file-if-exists=.env dist/server.js
```

File structure:
```bash
.env                # Development environment
.env.default        # Template with default values
.env.test          # Test environment
```

## Best Practices

### 1. Group Related Config

Organize configuration by domain:

```typescript
const CONFIG_SCHEMA = {
  db: { /* database config */ },
  app: { /* application config */ },
  auth: { /* authentication config */ },
  external: { /* external services */ },
} as const;
```

### 2. Document Variables

Add descriptions in comments:

```typescript
const CONFIG_SCHEMA = {
  db: {
    // PostgreSQL connection settings
    database: envvar("DB_DATABASE", z.string().min(1)),

    // Maximum number of connections in pool
    max: envvar("DB_MAX_CONNECTIONS",
      z.coerce.number().min(1).max(100).default(10)
    ),
  },
} as const;
```

### 3. Secure Secrets

Never commit secrets:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

Use secret management in production:

- HashiCorp Vault
- Kubernetes Secrets
- Environment variables from CI/CD

### 4. Provide Defaults Where Appropriate

```typescript
// Good - sensible defaults for non-critical config
logLevel: envvar("LOG_LEVEL", z.string().default("info")),
port: envvar("PORT", z.coerce.number().default(3000)),

// Bad - no default for critical config
apiKey: envvar("API_KEY", z.string()), // Should fail if missing
```

### 5. Use Type Guards

Create type guards for runtime checks:

```typescript
export function isProduction(config: Config): boolean {
  return config.app.environment === "production";
}

export function hasRedis(config: Config): config is Config & {
  redis: { url: string }
} {
  return !!config.redis?.url;
}
```

## Testing

### Mock Configuration

Create test configurations:

```typescript
// test/fixtures/config.ts
export const testConfig: Config = {
  db: {
    database: "test_db",
    host: "localhost",
    user: "test",
    password: "test",
    port: 5432,
    max: 5,
  },
};
```

### Override in Tests

```typescript
describe("Service", () => {
  it("should use test config", () => {
    const service = new MyService({
      config: testConfig,
    });

    expect(service.getDatabaseName()).toBe("test_db");
  });
});
```

## How Envase Works

Envase provides type-safe environment variable parsing:

1. **Define Schema** - Use `envvar()` to define each variable with Zod validation
2. **Parse at Startup** - `parseEnv()` validates all variables when config is generated
3. **Type Inference** - TypeScript infers types from the schema automatically
4. **Early Validation** - Invalid configuration prevents app startup

The combination of Node's `--env-file` for loading and Envase for validation provides a robust configuration system.
