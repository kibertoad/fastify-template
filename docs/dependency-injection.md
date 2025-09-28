# Dependency Injection

This project uses **Awilix** for dependency injection (DI), providing automatic dependency resolution, lifecycle management, and improved testability.

## Core Concepts

### What is Dependency Injection?
Dependency Injection is a design pattern where objects receive their dependencies from external sources rather than creating them internally. This promotes:

- **Loose coupling** - Components depend on abstractions, not concrete implementations
- **Testability** - Easy to mock dependencies in tests
- **Maintainability** - Changes to dependencies don't require changes to consumers
- **Scalability** - New features can be added without modifying existing code

### Awilix Overview
Awilix is a powerful DI container for JavaScript/TypeScript that provides:

- **Auto-wiring** - Automatically resolves and injects dependencies
- **Lifetime management** - Controls when instances are created and disposed
- **Proxy injection** - Dependencies are resolved when accessed, not at construction
- **Type safety** - Full TypeScript support with type inference

## Architecture

### DI Container Setup

The DI container is initialized in `app.ts`:

```typescript
// src/app.ts
const diContainer: AwilixContainer<AllDependencies> = createContainer({
  injectionMode: "PROXY", // Use proxy injection for lazy resolution
});

await app.register(fastifyAwilixPlugin, {
  container: diContainer,
  disposeOnClose: true,      // Clean up on app shutdown
  disposeOnResponse: false,  // Keep singletons alive between requests
  asyncInit: true,           // Support async initialization
  asyncDispose: true,        // Support async disposal
  eagerInject: true,         // Validate dependencies at startup
});
```

### Dependency Registration

Dependencies are registered in two phases:

#### 1. Core Dependencies
Core infrastructure dependencies are registered first:

```typescript
// src/infrastructure/coreDiConfig.ts
export function resolveCoreDependencies(
  app: FastifyInstance
): MandatoryNameAndRegistrationPair<CoreDependencies> {
  return {
    tsRestServer: asSingletonFunction(() => initServer()),
    awilixManager: asSingletonFunction(() => app.awilixManager),
    config: asSingletonFunction(() => generateConfig()),
    database: asSingletonFunction(({ config }: CoreDependencies) => {
      const dialect = new PostgresDialect({
        pool: new Pool(config.db),
      });
      return new Kysely<Database>({ dialect });
    }),
  };
}
```

#### 2. Module Dependencies
Each module registers its own dependencies:

```typescript
// src/modules/users/usersDiConfig.ts
export function resolveUserDependencies(): MandatoryNameAndRegistrationPair<UsersModuleDependencies> {
  return {
    usersController: asControllerClass(UsersController),
    usersService: asSingletonClass(UsersService),
    usersRepository: asSingletonClass(UsersRepository),
  };
}
```

### Dependency Resolution

Dependencies are resolved automatically using constructor injection:

```typescript
// src/modules/users/services/UsersService.ts
export class UsersService {
  private readonly usersRepository: UsersRepository;
  private readonly database: Kysely<Database>;

  constructor(dependencies: UsersModuleInjectableDependencies) {
    this.usersRepository = dependencies.usersRepository;
    this.database = dependencies.database;
  }

  async getUser(userId: number): Promise<User> {
    return this.usersRepository.findById(userId);
  }
}
```

## Lifecycle Management

### Lifetime Scopes

Awilix supports three lifetime scopes:

#### 1. SINGLETON (Default for services)
Created once and shared across the application:

```typescript
export function asSingletonClass<T>(
  Type: Constructor<T>,
  opts?: BuildResolverOptions<T>
): BuildResolver<T> {
  return asClass(Type, {
    ...opts,
    lifetime: "SINGLETON",
  });
}
```

#### 2. SCOPED
Created once per request (not commonly used in this setup):

```typescript
asClass(MyClass, { lifetime: "SCOPED" })
```

#### 3. TRANSIENT
Created every time it's resolved:

```typescript
asClass(MyClass, { lifetime: "TRANSIENT" })
```

### Disposal

Resources are automatically cleaned up:

```typescript
// Implement dispose method for cleanup
export class DatabaseService {
  async dispose() {
    await this.connection.close();
  }
}
```

## Type Safety

### Module Declaration Merging

TypeScript declarations ensure type safety:

```typescript
// src/infrastructure/coreDiConfig.ts
declare module "@fastify/awilix" {
  interface Cradle extends AllDependencies {}
  interface RequestCradle extends AllDependencies {}
}
```

### Public vs Injectable Dependencies

A critical architectural pattern in this project is the distinction between **public** and **injectable** dependencies:

#### Public Dependencies (Module Exports)
Each module defines which dependencies it exposes to other modules:

```typescript
// src/modules/users/usersDiConfig.ts
export type UsersModuleDependencies = {
  usersController: UsersController
  usersService: UsersService
  usersRepository: UsersRepository
};

// Other modules can only inject these dependencies
export type UsersModulePublicDependencies = Pick<UsersModuleDependencies, 'usersService'>
```

These are the dependencies that the module "publishes" to the DI container and makes available to other modules.

#### Injectable Dependencies (What a Module Can Use)
Each module also defines what it can inject - this includes:
1. Its own dependencies
2. Core dependencies (database, config, etc.)
3. Public dependencies from all other modules

```typescript
// src/modules/users/usersDiConfig.ts
export type UsersModuleInjectableDependencies =
  CoreDependencies &           // Can use core dependencies
  UsersModuleDependencies;     // Can use its own dependencies

// In a module that depends on users:
// src/modules/orders/ordersDiConfig.ts
export type OrdersModuleInjectableDependencies =
  CoreDependencies &           // Can use core dependencies
  OrdersModuleDependencies &   // Can use its own dependencies
  UsersModulePublicDependencies;     // Can use users module's public dependencies
```

#### Usage in Constructors
Classes always use the injectable type in their constructors:

```typescript
// src/modules/users/services/UsersService.ts
export class UsersService {
  private readonly usersRepository: UsersRepository;
  private readonly database: Kysely<Database>;

  // Uses UsersModuleInjectableDependencies - can access everything
  constructor(dependencies: UsersModuleInjectableDependencies) {
    this.usersRepository = dependencies.usersRepository;  // Own module
    this.database = dependencies.database;                 // Core dependency
  }
}

// src/modules/orders/services/OrdersService.ts
export class OrdersService {
  private readonly ordersRepository: OrdersRepository;
  private readonly usersService: UsersService;
  private readonly database: Kysely<Database>;

  // Can inject dependencies from other modules
  constructor(dependencies: OrdersModuleInjectableDependencies) {
    this.ordersRepository = dependencies.ordersRepository;  // Own module
    this.usersService = dependencies.usersService;         // From users module
    this.database = dependencies.database;                  // Core dependency
  }
}
```

#### Benefits of This Pattern

1. **Clear Module Boundaries** - Each module explicitly declares is public API, reducing direct coupling on the implementation details

2. **Type Safety** - TypeScript ensures you can only inject dependencies that are actually available

3. **Maintainability** - Clear understanding of inter-module dependencies

## Utility Functions

### Registration Helpers

The project provides utility functions in `src/infrastructure/diCommon.ts` for common DI patterns:

#### `asSingletonClass<T>`
```typescript
function asSingletonClass<T>(
  Type: Constructor<T>,
  opts?: BuildResolverOptions<T>
): BuildResolver<T> & DisposableResolver<T>
```
Registers a class as a singleton - created once and shared across the application. Used for services and repositories.

#### `asControllerClass<T>`
```typescript
function asControllerClass<T>(
  Type: Constructor<T>,
  opts?: BuildResolverOptions<T>
): BuildResolver<T> & DisposableResolver<T>
```
Registers a controller class with the `CONTROLLER_TAG` for auto-discovery. Controllers are automatically found and registered with ts-rest.

#### `asSingletonFunction<T>`
```typescript
function asSingletonFunction<T>(
  fn: FunctionReturning<T>,
  opts?: BuildResolverOptions<T>
): BuildResolver<T> & DisposableResolver<T>
```
Registers a factory function as a singleton. Used for creating instances that require custom initialization logic.

#### `registerDependencies`
```typescript
function registerDependencies(
  diContainer: AwilixContainer,
  resolvers: MandatoryNameAndRegistrationPair<unknown>
): void
```
Batch registers multiple dependencies into the DI container. Used by module plugins to register all module dependencies at once.

## Creating New Dependencies

### Step 1: Define the Dependency

```typescript
// src/modules/products/services/ProductsService.ts
export class ProductsService {
  private readonly productsRepository: ProductsRepository;
  private readonly database: Kysely<Database>;

  constructor(dependencies: ProductsModuleInjectableDependencies) {
    this.productsRepository = dependencies.productsRepository;
    this.database = dependencies.database;
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }
}
```

### Step 2: Define Module Types

```typescript
// src/modules/products/productsDiConfig.ts
import type { CoreDependencies } from "../../infrastructure/coreDiConfig.ts";
// Import other modules you depend on
import type { UsersModuleDependencies } from "../users/usersDiConfig.ts";

// Public dependencies - what this module exposes
export type ProductsModuleDependencies = {
  productsController: ProductsController;
  productsService: ProductsService;
  productsRepository: ProductsRepository;
};

// Injectable dependencies - what this module can use
// Always includes: CoreDependencies + own dependencies + dependencies from other modules
export type ProductsModuleInjectableDependencies =
  CoreDependencies &           // Always need core
  ProductsModuleDependencies & // Can use own dependencies
  UsersModuleDependencies;     // If products needs users functionality
```

### Step 3: Register Dependencies

```typescript
// src/modules/products/productsDiConfig.ts
export function resolveProductDependencies():
  MandatoryNameAndRegistrationPair<ProductsModuleDependencies> {
  return {
    productsController: asControllerClass(ProductsController),
    productsService: asSingletonClass(ProductsService),
    productsRepository: asSingletonClass(ProductsRepository),
  };
}
```

### Step 4: Create Module Plugin

```typescript
// src/modules/products/productsModulePlugin.ts
const plugin: FastifyPluginCallback<{ diContainer: AwilixContainer }> = (
  _app,
  opts,
  done
) => {
  const productDependencies = resolveProductDependencies();
  registerDependencies(opts.diContainer, productDependencies);
  done();
};
```

## Testing with DI

### Integration Testing

Test with real dependencies:

```typescript
describe("Integration", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();
    registerDependencies(container, resolveCoreDependencies());
    registerDependencies(container, resolveUserDependencies());
  });

  it("should resolve dependencies", () => {
    const service = container.resolve("usersService");
    expect(service).toBeInstanceOf(UsersService);
  });
});
```
