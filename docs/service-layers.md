# Service Layers & Modular System

This project follows a modular architecture with clear separation of concerns across different layers. Each module is self-contained and follows consistent patterns.

## Architecture Overview

### Layer Responsibilities

```
┌─────────────────┐
│   Controllers   │  HTTP layer - Request/Response handling
├─────────────────┤
│    Services     │  Business logic orchestration
├─────────────────┤
│  Repositories   │  Persistence layer - Database access via repository pattern
└─────────────────┘
```

Each layer has specific responsibilities:

- **Controllers** - Handle HTTP concerns, validate contracts, return responses
- **Services** - Implement business logic, orchestrate operations, enforce business rules
- **Repositories** - Persistence layer implementing the repository pattern with Kysely for type-safe database access

## Module Structure

### Standard Module Layout

Each module follows this structure:

```
src/modules/[module-name]/
├── controllers/
│   ├── [Module]Controller.ts       # HTTP endpoint handlers
│   └── [Module]Controller.spec.ts  # Controller tests
├── services/
│   ├── [Module]Service.ts          # Business logic
│   └── [Module]Service.spec.ts     # Service tests
├── repositories/
│   ├── [Module]Repository.ts       # Data access
│   └── [Module]Repository.spec.ts  # Repository tests
├── schemas/
│   └── [module]Schemas.ts          # Zod schemas & types
├── [module]DiConfig.ts              # Dependency injection config
└── [module]ModulePlugin.ts         # Fastify plugin registration
```

## Service Layer

Services contain business logic and orchestrate operations:

```typescript
// src/modules/users/services/UsersService.ts
export class UsersService {
  constructor(dependencies: UsersModuleInjectableDependencies) {
    this.usersRepository = dependencies.usersRepository;
    this.database = dependencies.database;
  }

  async getUser(userId: number): Promise<User> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new PublicNonRecoverableError(
        "USER_NOT_FOUND",
        `User with ID ${userId} not found`,
        404
      );
    }

    return user;
  }
}
```

### Service Patterns

#### Transaction Pattern
```typescript
async processOrder(orderData: OrderData): Promise<Order> {
  return await this.database.transaction().execute(async (trx) => {
    const order = await this.orderRepository.create(orderData, trx);
    await this.paymentService.process(order.total, trx);
    await this.inventoryService.decreaseStock(orderData.items, trx);
    return order;
  });
}
```

## Repository Layer

Repositories handle data access using Kysely:

```typescript
// src/modules/users/repositories/UsersRepository.ts
export class UsersRepository {
  constructor(dependencies: UsersModuleInjectableDependencies) {
    this.database = dependencies.database;
  }

  async findById(
    id: number,
    trx?: Transaction<Database>
  ): Promise<User | undefined> {
    const db = trx || this.database;

    return await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }

  async create(
    userData: NewUser,
    trx?: Transaction<Database>
  ): Promise<User> {
    const db = trx || this.database;

    return await db
      .insertInto("users")
      .values(userData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // Specialized queries
  async findActiveUsers(since: Date): Promise<User[]> {
    return await this.database
      .selectFrom("users")
      .selectAll()
      .where("last_active", ">=", since)
      .where("status", "=", "active")
      .execute();
  }
}
```


## Controller Layer

Controllers handle HTTP concerns using ts-rest contracts:

```typescript
// src/modules/users/controllers/UsersController.ts
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
    body: newUserSchema,
    responses: {
      201: c.type<User>(),
      400: c.type<{ error: string }>(),
    },
  },
});

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
        try {
          const user = await this.userService.getUser(
            Number.parseInt(params.userId, 10)
          );
          return { status: 200, body: user };
        } catch (error) {
          if (error.code === "USER_NOT_FOUND") {
            return { status: 404, body: { error: error.message } };
          }
          throw error;
        }
      },

      createUser: async ({ body }) => {
        const user = await this.userService.createUser(body);
        return { status: 201, body: user };
      },
    });
  }
}
```

## Creating a New Module

### Quick Guide

1. **Create module structure**
```bash
mkdir -p src/modules/products/{controllers,services,repositories,schemas}
```

2. **Define schemas** (`schemas/productSchemas.ts`)
```typescript
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive(),
});

export type Product = z.infer<typeof productSchema>;
```

3. **Create repository** (`repositories/ProductsRepository.ts`)
```typescript
export class ProductsRepository {
  constructor(dependencies: ProductsModuleInjectableDependencies) {
    this.database = dependencies.database;
  }
  // Data access methods
}
```

4. **Implement service** (`services/ProductsService.ts`)
```typescript
export class ProductsService {
  constructor(dependencies: ProductsModuleInjectableDependencies) {
    this.productsRepository = dependencies.productsRepository;
  }
  // Business logic methods
}
```

5. **Configure DI** (`productsDiConfig.ts`)
```typescript
export type ProductsModuleDependencies = {
  productsController: ProductsController;
  productsService: ProductsService;
  productsRepository: ProductsRepository;
};

export type ProductsModuleInjectableDependencies =
  CoreDependencies & ProductsModuleDependencies;

export function resolveProductDependencies() {
  return {
    productsController: asControllerClass(ProductsController),
    productsService: asSingletonClass(ProductsService),
    productsRepository: asSingletonClass(ProductsRepository),
  };
}
```

6. **Create module plugin** (`productsModulePlugin.ts`)
```typescript
const plugin: FastifyPluginCallback<{ diContainer: AwilixContainer }> = (
  _app,
  opts,
  done
) => {
  const productDependencies = resolveProductDependencies();
  registerDependencies(opts.diContainer, productDependencies);
  done();
};

export const productsModulePlugin = fp(plugin, {
  fastify: ">=4.x",
  name: "products-module-plugin",
});
```

7. **Register in app** (`app.ts`)
```typescript
await app.register(productsModulePlugin, { diContainer });
```

## Best Practices

1. **Single Responsibility** - Each layer has one clear purpose
2. **Dependency Direction** - Controllers → Services → Repositories
3. **Transaction Boundaries** - Services define transaction scope
