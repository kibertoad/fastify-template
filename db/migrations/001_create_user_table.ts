import { type Kysely, sql } from "kysely";
import type { Database } from "../database.ts";

export async function up(db: Kysely<Database>): Promise<void> {
	await db.schema
		.createTable("user")
		.addColumn("id", "serial", (col) => col.primaryKey())
		.addColumn("first_name", "varchar", (col) => col.notNull())
		.addColumn("last_name", "varchar")
		.addColumn("created_at", "timestamp", (col) =>
			col.defaultTo(sql`now()`).notNull(),
		)
		.addColumn("metadata", "jsonb", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
	await db.schema.dropTable("user").execute();
}
