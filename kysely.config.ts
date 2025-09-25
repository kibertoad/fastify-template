import { defineConfig } from "kysely-ctl";
import { Pool } from "pg";
import { generateConfig } from "./src/infrastructure/config.ts";

const config = generateConfig();

export default defineConfig({
	dialect: "pg",
	dialectConfig: {
		pool: new Pool(config.db),
	},
	migrations: {
		migrationFolder: "db/migrations",
	},
});
