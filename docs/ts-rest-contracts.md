# ts-rest Contract-Based Development

This project uses **[ts-rest](https://ts-rest.com/)** for type-safe, contract-first API development. Contracts define the API shape once and provide end-to-end type safety from backend to frontend.

## Core Concepts

### What is ts-rest?

ts-rest enables:
- **Contract-First Development** - Single source of truth for API definitions
- **End-to-End Type Safety** - Types flow automatically from backend to frontend
- **Runtime Validation** - Automatic request/response validation with Zod
- **Framework Agnostic** - Works with Fastify, Express, Next.js, and more

📚 **[Official Documentation](https://ts-rest.com/docs/intro)**

## Project Implementation

### Contract Definition

Contracts are defined using `initContract()` and Zod schemas:

```typescript
// src/modules/users/controllers/UsersController.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const USER_CONTRACTS = c.router({
  getUser: {
    method: "GET",
    path: "/users/:userId",
    responses: {
      200: c.type<User>(),
      404: c.type<{ error: string }>(),
    },
  },

  createUser: {
    method: "POST",
    path: "/users",
    body: newUserSchema,  // Zod schema for validation
    responses: {
      201: c.type<User>(),
      400: c.type<{ error: string }>(),
    },
  },
});
```

### Controller Implementation

Controllers extend `AbstractController` and implement the contract:

```typescript
export class UsersController extends AbstractController<UserContracts> {
  public contract = USER_CONTRACTS;

  constructor(dependencies: UsersModuleInjectableDependencies) {
    super();
    this.userService = dependencies.usersService;
    this.tsRestServer = dependencies.tsRestServer;
  }

  override resolveRouter(): RouterImplementation<UserContracts> {
    return this.tsRestServer.router(this.contract, {
      getUser: async ({ params }) => {
        const user = await this.userService.getUser(
          Number.parseInt(params.userId, 10)
        );

        return {
          status: 200,
          body: user,
        };
      },

      createUser: async ({ body }) => {
        // body is already validated against newUserSchema
        const user = await this.userService.createUser(body);

        return {
          status: 201,
          body: user,
        };
      },
    });
  }
}
```

### Registration in App

Controllers are automatically discovered and registered:

```typescript
// src/app.ts
app.after(() => {
  const allControllers = awilixManager.getWithTags(diContainer, [CONTROLLER_TAG]);

  const s = initServer();
  for (const controller of Object.values(allControllers)) {
    s.registerRouter(
      controller.contract,
      controller.resolveRouter(),
      app,
      { logInitialization: true }
    );
  }
});
```

## Key Benefits in This Project

### 1. Automatic Validation
- Request bodies are validated against Zod schemas
- Invalid requests are rejected with 400 status
- No manual validation code needed

### 2. Type Safety
- Parameters, query strings, and bodies are fully typed
- Response types are enforced
- Compile-time checking prevents type mismatches

### 3. Contract as Documentation
- Contracts serve as API documentation
- Can generate OpenAPI/Swagger specs
- Frontend and backend stay in sync

## Frontend Integration

When using ts-rest on the frontend:

```typescript
// Frontend client setup
import { initClient } from "@ts-rest/core";
import { USER_CONTRACTS } from "./contracts";

const client = initClient(USER_CONTRACTS, {
  baseUrl: "http://localhost:3000",
});

// Type-safe API calls
const response = await client.getUser({
  params: { userId: "123" }
});

if (response.status === 200) {
  // response.body is typed as User
  console.log(response.body.name);
}
```

## Creating New Endpoints

1. **Define Contract** - Add endpoint to contract router
2. **Add Response Types** - Define all possible response statuses
3. **Implement Handler** - Add implementation in controller's `resolveRouter()`
4. **Types Flow Automatically** - No additional type definitions needed

## Best Practices

### Contract Organization
- Keep contracts close to controllers
- Group related endpoints in the same contract
- Use shared schemas for common types

### Error Handling
```typescript
// Return appropriate status codes
if (error.code === "USER_NOT_FOUND") {
  return {
    status: 404,
    body: { error: "User not found" },
  };
}
```

### Validation Schemas
```typescript
// Reuse Zod schemas for validation and typing
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

export type User = z.infer<typeof userSchema>;
```

## Learn More

- 📖 [ts-rest Documentation](https://ts-rest.com/docs/intro)
- 🚀 [Quick Start Guide](https://ts-rest.com/docs/quickstart)
- 🔧 [Fastify Integration](https://ts-rest.com/docs/fastify)
- 📝 [Zod Integration](https://ts-rest.com/docs/zod)
- 🌐 [OpenAPI Generation](https://ts-rest.com/docs/open-api)

## Summary

ts-rest in this project provides:
- **Single Contract Definition** - One source of truth for API shape
- **Automatic Validation** - Zod schemas validate at runtime
- **Type Safety** - Full TypeScript support throughout
- **Clean Architecture** - Controllers focus on HTTP, services on business logic

The combination of ts-rest contracts, Zod validation, and our modular architecture ensures APIs are type-safe, well-documented, and maintainable.