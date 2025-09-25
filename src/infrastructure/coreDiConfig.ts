import { initServer } from "@ts-rest/fastify";
import type { NameAndRegistrationPair, Resolver } from "awilix";
import type { AwilixManager } from "awilix-manager";
import type { FastifyInstance } from "fastify";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "../../db/database.ts";
import type { UsersModuleDependencies } from "../modules/users/usersDiConfig.ts";
import { type Config, generateConfig } from "./config.ts";
import { asSingletonFunction } from "./diCommon.ts";

export type MandatoryNameAndRegistrationPair<T> = {
	[U in keyof T]: Resolver<T[U]>;
};

export type DependencyOverrides = Partial<DiConfig>;
export type AllDependencies = CoreDependencies & UsersModuleDependencies;
type DiConfig = NameAndRegistrationPair<AllDependencies>;

declare module "@fastify/awilix" {
	interface Cradle extends AllDependencies {}
	interface RequestCradle extends AllDependencies {}
}

export type TSRestServer = ReturnType<typeof initServer>;

export type CoreDependencies = {
	tsRestServer: TSRestServer;
	awilixManager: AwilixManager;
	config: Config;
	database: Kysely<Database>;
};

export function resolveCoreDependencies(
	app: FastifyInstance,
): MandatoryNameAndRegistrationPair<CoreDependencies> {
	return {
		tsRestServer: asSingletonFunction(() => initServer()),
		awilixManager: asSingletonFunction(() => app.awilixManager),
		config: asSingletonFunction(() => generateConfig()),

		database: asSingletonFunction(({ config }: CoreDependencies) => {
			const dialect = new PostgresDialect({
				pool: new Pool(config.db),
			});

			return new Kysely<Database>({
				dialect,
			});
		}),
	};
}
