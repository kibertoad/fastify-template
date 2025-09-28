# Kysely Database Setup

**Kysely** is a type-safe SQL query builder for TypeScript, providing compile-time safety for database queries without the overhead of a full ORM.

## Overview

Kysely provides:
- **Type-safe queries** - Compile-time validation of SQL queries
- **Auto-completion** - IntelliSense for table names, columns, and operations
- **Raw SQL support** - Escape hatch when needed
- **Migration system** - Schema versioning and evolution
- **Database agnostic** - Support for PostgreSQL, MySQL, SQLite, and more
- **Lightweight** - Minimal runtime overhead

## Database Configuration

### Connection Setup

The database connection is configured in `src/infrastructure/coreDiConfig.ts`:

```typescript
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "../../db/database.ts";

database: asSingletonFunction(({ config }: CoreDependencies) => {
  const dialect = new PostgresDialect({
    pool: new Pool({
      database: config.db.database,
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      port: config.db.port,
      max: config.db.max,
    }),
  });

  return new Kysely<Database>({
    dialect,
  });
}),
```

### Database Types

Define your database schema types in `db/database.ts`:

```typescript
// db/database.ts
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

// Define table interfaces
export interface UserTable {
  id: Generated<number>;
  email: string;
  name: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  updated_at: ColumnType<Date, string | undefined, string>;
}

export interface ProductTable {
  id: Generated<number>;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  created_at: ColumnType<Date, string | undefined, never>;
}

// Database interface combining all tables
export interface Database {
  users: UserTable;
  products: ProductTable;
}

// Helper types for each table
export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export type Product = Selectable<ProductTable>;
export type NewProduct = Insertable<ProductTable>;
export type ProductUpdate = Updateable<ProductTable>;
```

### 2. Use Repository Pattern
Encapsulate queries in repositories:

```typescript
// Good
class UsersRepository {
  async findById(id: number): Promise<User | undefined> {
    return await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
}

// Bad - queries scattered throughout codebase
async function getUser(id: number) {
  return await db.selectFrom("users")...
}
```

### 3. Handle Errors Gracefully

```typescript
async findById(id: number): Promise<User> {
  const user = await this.db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();

  if (!user) {
    throw new NotFoundError(`User with id ${id} not found`);
  }

  return user;
}
```

### 4. Use Transactions for Multi-Step Operations

```typescript
// Good - atomic operation
await db.transaction().execute(async (trx) => {
  await trx.insertInto("orders")...
  await trx.updateTable("inventory")...
});

// Bad - partial failure possible
await db.insertInto("orders")...
await db.updateTable("inventory")...
```

### 5. Parameterize Queries
Kysely automatically parameterizes queries, preventing SQL injection:

```typescript
// Safe - automatically parameterized
await db
  .selectFrom("users")
  .where("email", "=", userInput)
  .execute();
```
