import type { Kysely } from "kysely";
import type { Database, NewUser } from "../../../../db/database.ts";
import type { UsersModuleInjectableDependencies } from "../usersDiConfig.ts";

export class UsersRepository {
	private readonly database: Kysely<Database>;

	constructor(dependencies: UsersModuleInjectableDependencies) {
		this.database = dependencies.database;
	}

	getUser(id: number) {
		return this.database
			.selectFrom("user")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst();
	}

	createUser(user: NewUser) {
		return this.database
			.insertInto("user")
			.values(user)
			.returningAll()
			.executeTakeFirstOrThrow();
	}
}
