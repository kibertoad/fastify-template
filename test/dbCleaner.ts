import type { Kysely } from "kysely";
import type { Database } from "../db/database.ts";

type TableName = keyof Database;

export async function cleanDatabase(
	db: Kysely<Database>,
	tables: readonly TableName[],
): Promise<void> {
	for (const table of tables) {
		await db.deleteFrom(table).execute();
	}
}
