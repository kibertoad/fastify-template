# Fastify Plugins

Fastify plugins are the building blocks of a Fastify application. They provide a way to encapsulate functionality, register routes, add decorators, and manage the application lifecycle.

## Plugin Architecture

### Core Concepts

Plugins in Fastify provide encapsulation through a concept called "contexts". Each plugin has its own context, which means:

- Decorators, hooks, and plugins registered inside a plugin are encapsulated
- The encapsulation can be broken using `fastify-plugin` for cross-cutting concerns
- Plugins support options and dependencies

### Plugin Types in This Project

#### 1. Module Plugins
Module plugins register entire feature modules with their dependencies:

```typescript
// src/modules/users/usersModulePlugin.ts
import type { AwilixContainer } from "awilix";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

export type UsersModuleOptions = {
  diContainer: AwilixContainer;
};

const plugin: FastifyPluginCallback<UsersModuleOptions> = (
  _app,
  opts,
  done
) => {
  const userDependencies = resolveUserDependencies();
  registerDependencies(opts.diContainer, userDependencies);
  done();
};

export const usersModulePlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "users-module-plugin",
});
```

#### 2. Utility Plugins
Utility plugins provide cross-cutting functionality:

```typescript
// src/plugins/healthcheckPlugin.ts
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

const plugin: FastifyPluginCallback = (app, _, done) => {
  app.get("/healthcheck", async () => {
    return { status: "OK", timestamp: new Date().toISOString() };
  });
  done();
};

export const healthcheckPlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "healthcheck-plugin",
});
```

## Plugin Registration

### Registration Order
Plugin registration order matters in Fastify:

1. **Core plugins** - Authentication, logging, error handling
2. **Infrastructure plugins** - Database, DI container (Awilix)
3. **Module plugins** - Feature modules with their routes
4. **Utility plugins** - Health checks, metrics, etc.

### Example Registration Flow

```typescript
// src/app.ts
export const startApp = async () => {
  const app = fastify();

  // 1. Register utility plugins first
  await app.register(healthcheckPlugin);

  // 2. Register DI container plugin
  await app.register(fastifyAwilixPlugin, {
    container: diContainer,
    disposeOnClose: true,
    // ... other options
  });

  // 3. Register module plugins
  await app.register(usersModulePlugin, {
    diContainer,
  });

  // 4. After all plugins, register controllers
  app.after(() => {
    // Controller registration logic
  });

  return app;
};
```

## Creating New Plugins

### Basic Plugin Template

```typescript
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

export type MyPluginOptions = {
  // Define your plugin options
  optionA: string;
  optionB?: number;
};

const plugin: FastifyPluginCallback<MyPluginOptions> = (
  app,
  opts,
  done
) => {
  // Plugin logic here

  // Add decorators
  app.decorate("myUtility", () => {
    // utility function
  });

  // Add hooks
  app.addHook("onRequest", async (request, reply) => {
    // hook logic
  });

  // Register routes
  app.get("/my-route", async (request, reply) => {
    return { message: "Hello from plugin" };
  });

  done();
};

// Use fastify-plugin to break encapsulation if needed
export const myPlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "my-plugin",
  dependencies: ["dep1", "dep2"], // Optional dependencies
});
```

### Module Plugin Template

For feature modules, follow this pattern:

```typescript
import type { AwilixContainer } from "awilix";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

export type ModuleOptions = {
  diContainer: AwilixContainer;
};

const plugin: FastifyPluginCallback<ModuleOptions> = (
  _app,
  opts,
  done
) => {
  // Resolve and register module dependencies
  const dependencies = resolveModuleDependencies();
  registerDependencies(opts.diContainer, dependencies);

  done();
};

export const modulePlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "module-plugin",
});
```

## Best Practices

### 1. Use fastify-plugin for Shared Functionality
When you need decorators or hooks available throughout the application:

```typescript
export const sharedPlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "shared-plugin",
});
```

### 2. Type Your Plugin Options
Always define TypeScript types for plugin options:

```typescript
export type PluginOptions = {
  required: string;
  optional?: number;
};
```

### 3. Handle Async Operations
Use async/await pattern for asynchronous plugin registration:

```typescript
const plugin: FastifyPluginAsync<Options> = async (app, opts) => {
  // Async operations
  await someAsyncOperation();

  // No need to call done() with async plugins
};
```

### 4. Error Handling in Plugins
Propagate errors properly:

```typescript
const plugin: FastifyPluginCallback = (app, opts, done) => {
  try {
    // Plugin logic
    done();
  } catch (error) {
    done(error);
  }
};
```

### 5. Plugin Dependencies
Declare plugin dependencies explicitly:

```typescript
export const myPlugin = fp(plugin, {
  dependencies: ["@fastify/awilix"],
  name: "my-plugin",
});
```

## Testing Plugins

Test plugins in isolation:

```typescript
import fastify from "fastify";
import { myPlugin } from "./myPlugin";

describe("MyPlugin", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    await app.register(myPlugin, { /* options */ });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("should register route", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/my-route",
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## Common Patterns

### Authentication Plugin
```typescript
export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", async (request: FastifyRequest) => {
    // Authentication logic
  });

  app.addHook("onRequest", async (request) => {
    if (needsAuth(request)) {
      await app.authenticate(request);
    }
  });
});
```
